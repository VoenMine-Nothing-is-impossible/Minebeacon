export const dynamic = "force-dynamic";
import nodemailer from "nodemailer";
import { j, err } from "@/lib/api";
import { getCurrentUser, checkCsrf } from "@/lib/session";
import { getSetting } from "@/lib/settings";
export async function POST(req: Request) {
  if (!(await checkCsrf(req))) return err("csrf", 403);
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return err("forbidden", 403);
  const { to } = await req.json().catch(() => ({}));
  const target = String(to || u.email);
  try {
    const host = await getSetting("smtp_host");
    const port = Number((await getSetting("smtp_port")) || "587");
    const user = await getSetting("smtp_user");
    const pass = await getSetting("smtp_pass");
    const enc = await getSetting("smtp_enc");
    if (!host) return err("smtp_not_configured", 400);
    const t = nodemailer.createTransport({
      host, port, secure: enc === "ssl", requireTLS: enc === "starttls",
      auth: user ? { user, pass } : undefined, connectionTimeout: 8000
    });
    const from = await getSetting("smtp_from");
    const fromName = await getSetting("smtp_from_name");
    await t.sendMail({
      from: from ? `"${fromName}" <${from}>` : undefined,
      to: target, subject: "MineBeacon SMTP test", text: "SMTP работает. MineBeacon."
    });
    return j({ ok: true });
  } catch (e) {
    return j({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
}
