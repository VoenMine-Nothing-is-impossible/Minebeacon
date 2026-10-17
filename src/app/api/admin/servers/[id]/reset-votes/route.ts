export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j, err, ipOf } from "@/lib/api";
import { getCurrentUser, checkCsrf } from "@/lib/session";
import { audit } from "@/lib/audit";
import { monthKey } from "@/lib/mc-ping";
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!(await checkCsrf(req))) return err("csrf", 403);
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return err("forbidden", 403);
  const body = await req.json().catch(() => ({}));
  // экшен: hide/show/feature/verify/reset-votes/delete
  const s = await prisma.server.findUnique({ where: { id: params.id } });
  if (!s) return err("not_found", 404);
  const a = String(body.action || "reset-votes");
  if (a === "reset-votes") {
    await prisma.vote.deleteMany({ where: { serverId: s.id } });
    await prisma.server.update({ where: { id: s.id }, data: { votesTotal: 0, votesMonth: 0, votesMonthKey: monthKey() } });
  } else if (a === "hide") await prisma.server.update({ where: { id: s.id }, data: { hidden: true } });
  else if (a === "show") await prisma.server.update({ where: { id: s.id }, data: { hidden: false } });
  else if (a === "feature") await prisma.server.update({ where: { id: s.id }, data: { featured: !!body.value } });
  else if (a === "verify") await prisma.server.update({ where: { id: s.id }, data: { verified: !!body.value } });
  else if (a === "delete") await prisma.server.delete({ where: { id: s.id } });
  else return err("unknown_action", 400);
  await audit(u.id, `admin_server_${a}`, "server", s.id, body, ipOf(req));
  return j({ ok: true });
}
