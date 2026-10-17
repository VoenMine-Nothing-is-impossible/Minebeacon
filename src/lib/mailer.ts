import nodemailer from "nodemailer";
import { prisma } from "./prisma";
import { getSetting } from "./settings";

export function renderTpl(tpl: string, vars: Record<string, string>): string {
  let out = tpl;
  for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(v ?? "");
  return out;
}

async function transporter() {
  const host = await getSetting("smtp_host");
  const port = Number((await getSetting("smtp_port")) || "587");
  const user = await getSetting("smtp_user");
  const pass = await getSetting("smtp_pass");
  const enc = await getSetting("smtp_enc");
  const secure = enc === "ssl";
  return nodemailer.createTransport({
    host, port, secure,
    requireTLS: enc === "starttls",
    auth: user ? { user, pass } : undefined,
    connectionTimeout: 8000
  });
}
export function smtpConfigured(): Promise<boolean> {
  return getSetting("smtp_host").then(h => !!h);
}
export async function queueEmail(to: string, subject: string, body: string) {
  await prisma.emailQueue.create({ data: { to, subject, body } });
}
export async function processEmailQueue(limit = 10): Promise<{ sent: number; failed: number }> {
  let sent = 0, failed = 0;
  const items = await prisma.emailQueue.findMany({
    where: { sentAt: null, attempts: { lt: 5 } }, orderBy: { createdAt: "asc" }, take: limit
  });
  if (!items.length) return { sent, failed };
  const t = await transporter();
  const fromAddr = (await getSetting("smtp_from")) || undefined;
  const fromName = (await getSetting("smtp_from_name")) || "MineBeacon";
  for (const m of items) {
    try {
      await t.sendMail({ from: fromAddr ? `"${fromName}" <${fromAddr}>` : undefined, to: m.to, subject: m.subject, text: m.body });
      await prisma.emailQueue.update({ where: { id: m.id }, data: { sentAt: new Date(), lastError: "" } });
      sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await prisma.emailQueue.update({ where: { id: m.id }, data: { attempts: m.attempts + 1, lastError: msg.slice(0, 500) } });
      failed++;
    }
  }
  return { sent, failed };
}
