export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j, err, ipOf } from "@/lib/api";
import { checkCsrf, createSession, setSessionCookies, getClientIp } from "@/lib/session";
import { loginSchema } from "@/lib/validators";
import { verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  if (!(await checkCsrf(req))) return err("csrf", 403);
  const ip = ipOf(req);
  const rl = await rateLimit(`login:${ip}`, 20, 600);
  if (!rl.ok) return err("rate_limited", 429);
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return err("invalid_data", 400);
  const { login, password } = parsed.data;
  const user = await prisma.user.findFirst({
    where: { OR: [{ login }, { email: login }] }
  });
  if (!user || !user.passwordHash) return err("bad_credentials", 401);
  if (user.blocked) return err("blocked", 403);
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    await audit(user.id, "login_fail", "user", user.id, {}, ip);
    return err("bad_credentials", 401);
  }
  const ua = req.headers.get("user-agent") || "";
  const token = await createSession(user.id, ip, ua);
  setSessionCookies(token);
  await audit(user.id, "login", "user", user.id, {}, ip);
  return j({ ok: true, mustChangePass: user.mustChangePass, role: user.role });
}
