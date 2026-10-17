export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j, err, ipOf } from "@/lib/api";
import { checkCsrf, createSession, setSessionCookies } from "@/lib/session";
import { verifyTelegram } from "@/lib/telegram";
import { getSetting } from "@/lib/settings";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  if (!(await checkCsrf(req))) return err("csrf", 403);
  const enabled = await getSetting("telegram_enabled");
  if (enabled !== "1") return err("disabled", 403);
  const botToken = await getSetting("telegram_bot_token");
  if (!botToken) return err("not_configured", 500);
  const data = await req.json().catch(() => null);
  if (!data || !data.id || !data.hash) return err("invalid_data", 400);
  const strData: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) strData[k] = String(v);
  if (!verifyTelegram(strData, botToken)) return err("bad_signature", 401);
  const tgId = String(data.id);
  let acc = await prisma.linkedAccount.findUnique({
    where: { provider_providerId: { provider: "telegram", providerId: tgId } }, include: { user: true }
  });
  let user = acc?.user || null;
  if (!user) {
    const username = String(data.username || `tg_${tgId}`).slice(0, 32);
    let login = username.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
    let i = 0;
    while (await prisma.user.findUnique({ where: { login: i ? `${login}${i}` : login } })) i++;
    if (i) login = `${login}${i}`;
    const email = `tg_${tgId}@example.local`;
    user = await prisma.user.create({ data: { login, email, emailVerified: false } });
    await prisma.linkedAccount.create({ data: { userId: user.id, provider: "telegram", providerId: tgId } });
  }
  if (user.blocked) return err("blocked", 403);
  const ip = ipOf(req);
  const token = await createSession(user.id, ip, req.headers.get("user-agent") || "");
  setSessionCookies(token);
  await audit(user.id, "oauth_telegram", "user", user.id, {}, ip);
  return j({ ok: true });
}
