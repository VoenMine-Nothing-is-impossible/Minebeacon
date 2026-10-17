export const dynamic = "force-dynamic";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { j, err, ipOf } from "@/lib/api";
import { checkCsrf } from "@/lib/session";
import { registerSchema } from "@/lib/validators";
import { hashPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";
import { getSetting } from "@/lib/settings";
import { audit } from "@/lib/audit";
import { queueEmail } from "@/lib/mailer";
import { appUrl } from "@/lib/session";

export async function POST(req: Request) {
  if (!(await checkCsrf(req))) return err("csrf", 403);
  const ip = ipOf(req);
  const rl = await rateLimit(`reg:${ip}`, 10, 3600);
  if (!rl.ok) return err("rate_limited", 429);
  const reg = await getSetting("registration_enabled");
  if (reg === "0") return err("registration_disabled", 403);
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return err("invalid_data", 400);
  const { login, email, password } = parsed.data;
  const exists = await prisma.user.findFirst({ where: { OR: [{ login }, { email }] } });
  if (exists) return err("user_exists", 409);
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { login, email, passwordHash } });
  const smtpHost = await getSetting("smtp_host");
  if (smtpHost) {
    const token = crypto.randomBytes(24).toString("hex");
    await prisma.emailVerify.create({
      data: { userId: user.id, token, expiresAt: new Date(Date.now() + 24 * 3600 * 1000) }
    });
    await queueEmail(email, "MineBeacon: confirm email",
      `Confirm: ${appUrl()}/verify?token=${token}`);
  } else {
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
  }
  await audit(user.id, "register", "user", user.id, { login }, ip);
  return j({ ok: true });
}
