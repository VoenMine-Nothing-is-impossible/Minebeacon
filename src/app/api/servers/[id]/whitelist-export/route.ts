export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j, err } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const u = await getCurrentUser();
  if (!u) return err("auth", 401);
  const s = await prisma.server.findUnique({ where: { id: params.id } });
  if (!s) return err("not_found", 404);
  if (s.ownerId !== u.id && u.role !== "admin") return err("forbidden", 403);
  const apps = await prisma.whitelistApplication.findMany({ where: { serverId: s.id, status: "approved" } });
  const nicks = [...new Set(apps.map(a => a.nick))];
  const payload = nicks.map(n => ({ name: n }));
  return j(payload);
}
