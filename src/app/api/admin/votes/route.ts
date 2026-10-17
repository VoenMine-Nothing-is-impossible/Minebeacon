export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j, err, ipOf } from "@/lib/api";
import { getCurrentUser, checkCsrf } from "@/lib/session";
import { audit } from "@/lib/audit";
export async function GET(req: Request) {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return err("forbidden", 403);
  const url = new URL(req.url);
  const serverId = url.searchParams.get("serverId") || "";
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const per = 30;
  const where = serverId ? { serverId } : {};
  const [total, items] = await Promise.all([
    prisma.vote.count({ where }),
    prisma.vote.findMany({
      where, skip: (page - 1) * per, take: per, orderBy: { createdAt: "desc" },
      include: { user: { select: { login: true } }, server: { select: { name: true } } }
    })
  ]);
  return j({ total, page, per, items });
}
export async function DELETE(req: Request) {
  if (!(await checkCsrf(req))) return err("csrf", 403);
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return err("forbidden", 403);
  const { ids, block } = await req.json().catch(() => ({}));
  if (!Array.isArray(ids)) return err("invalid_data", 400);
  if (block) await prisma.vote.updateMany({ where: { id: { in: ids } }, data: { blocked: true } });
  else await prisma.vote.deleteMany({ where: { id: { in: ids } } });
  await audit(u.id, "admin_votes_mod", "vote", "", { ids, block }, ipOf(req));
  return j({ ok: true });
}
