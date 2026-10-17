export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j, err, ipOf } from "@/lib/api";
import { getCurrentUser, checkCsrf } from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { audit } from "@/lib/audit";
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!(await checkCsrf(req))) return err("csrf", 403);
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return err("forbidden", 403);
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if ("blocked" in body) data.blocked = !!body.blocked;
  if ("role" in body && ["user", "admin"].includes(body.role)) data.role = body.role;
  if (body.newPassword) data.passwordHash = await hashPassword(String(body.newPassword));
  if (body.mustChangePass !== undefined) data.mustChangePass = !!body.mustChangePass;
  await prisma.user.update({ where: { id: params.id }, data });
  if (body.newPassword) await prisma.session.deleteMany({ where: { userId: params.id } });
  await audit(u.id, "admin_user_update", "user", params.id, body, ipOf(req));
  return j({ ok: true });
}
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!(await checkCsrf(req))) return err("csrf", 403);
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return err("forbidden", 403);
  if (params.id === u.id) return err("self_delete", 400);
  await prisma.user.delete({ where: { id: params.id } });
  await audit(u.id, "admin_user_delete", "user", params.id, {}, ipOf(req));
  return j({ ok: true });
}
