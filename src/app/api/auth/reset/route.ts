export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j, err } from "@/lib/api";
import { checkCsrf } from "@/lib/session";
import { hashPassword } from "@/lib/password";
export async function POST(req: Request) {
  if (!(await checkCsrf(req))) return err("csrf", 403);
  const { token, password } = await req.json().catch(() => ({}));
  if (!token || !password || String(password).length < 8) return err("invalid_data", 400);
  const pr = await prisma.passwordReset.findUnique({ where: { token } });
  if (!pr || pr.used || pr.expiresAt.getTime() < Date.now()) return err("bad_token", 400);
  const hash = await hashPassword(String(password));
  await prisma.user.update({ where: { id: pr.userId }, data: { passwordHash: hash, mustChangePass: false } });
  await prisma.passwordReset.update({ where: { id: pr.id }, data: { used: true } });
  return j({ ok: true });
}
