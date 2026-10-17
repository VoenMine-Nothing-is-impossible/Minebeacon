export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j, err } from "@/lib/api";
import { getCurrentUser, checkCsrf } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";
export async function POST(req: Request) {
  if (!(await checkCsrf(req))) return err("csrf", 403);
  const u = await getCurrentUser();
  if (!u) return err("auth", 401);
  const { oldPassword, newPassword } = await req.json().catch(() => ({}));
  if (!newPassword || String(newPassword).length < 8) return err("invalid_data", 400);
  if (u.passwordHash) {
    const ok = await verifyPassword(String(oldPassword || ""), u.passwordHash);
    if (!ok) return err("bad_credentials", 401);
  }
  await prisma.user.update({
    where: { id: u.id },
    data: { passwordHash: await hashPassword(String(newPassword)), mustChangePass: false }
  });
  await prisma.session.deleteMany({ where: { userId: u.id } });
  return j({ ok: true });
}
