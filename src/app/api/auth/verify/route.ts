export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j, err } from "@/lib/api";
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  if (!token) return err("bad_token", 400);
  const v = await prisma.emailVerify.findUnique({ where: { token } });
  if (!v || v.used || v.expiresAt.getTime() < Date.now()) return err("bad_token", 400);
  await prisma.user.update({ where: { id: v.userId }, data: { emailVerified: true } });
  await prisma.emailVerify.update({ where: { id: v.id }, data: { used: true } });
  return j({ ok: true });
}
