export const dynamic = "force-dynamic";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { j, err, ipOf } from "@/lib/api";
import { checkCsrf, appUrl } from "@/lib/session";
import { queueEmail } from "@/lib/mailer";
import { getSetting } from "@/lib/settings";
import { rateLimit } from "@/lib/rate-limit";
export async function POST(req: Request) {
  if (!(await checkCsrf(req))) return err("csrf", 403);
  const ip = ipOf(req);
  const rl = await rateLimit(`forgot:${ip}`, 5, 3600);
  if (!rl.ok) return err("rate_limited", 429);
  const { email } = await req.json().catch(() => ({}));
  if (!email) return err("invalid_data", 400);
  const user = await prisma.user.findUnique({ where: { email } });
  // всегда ok чтобы не раскрывать наличие
  if (user) {
    const token = crypto.randomBytes(24).toString("hex");
    await prisma.passwordReset.create({
      data: { userId: user.id, token, expiresAt: new Date(Date.now() + 3600 * 1000) }
    });
    const host = await getSetting("smtp_host");
    if (host) await queueEmail(email, "MineBeacon: password reset",
      `Reset: ${appUrl()}/reset?token=${token}`);
  }
  return j({ ok: true });
}
