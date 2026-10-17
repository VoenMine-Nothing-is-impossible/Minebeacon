export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j, err } from "@/lib/api";
import { getCurrentUser, checkCsrf } from "@/lib/session";
export async function GET() {
  const u = await getCurrentUser();
  if (!u) return err("auth", 401);
  const items = await prisma.notification.findMany({
    where: { userId: u.id }, orderBy: { createdAt: "desc" }, take: 30
  });
  const unread = items.filter(i => !i.read).length;
  return j({ items, unread });
}
export async function POST(req: Request) {
  if (!(await checkCsrf(req))) return err("csrf", 403);
  const u = await getCurrentUser();
  if (!u) return err("auth", 401);
  await prisma.notification.updateMany({ where: { userId: u.id, read: false }, data: { read: true } });
  return j({ ok: true });
}
