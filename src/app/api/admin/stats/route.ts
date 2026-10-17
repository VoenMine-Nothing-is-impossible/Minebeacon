export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j, err } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
export async function GET() {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return err("forbidden", 403);
  const days: { date: string; users: number; servers: number; votes: number; apps: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const start = new Date(d.setHours(0, 0, 0, 0));
    const end = new Date(start.getTime() + 86400000);
    const [users, servers, votes, apps] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: start, lt: end } } }),
      prisma.server.count({ where: { createdAt: { gte: start, lt: end } } }),
      prisma.vote.count({ where: { createdAt: { gte: start, lt: end } } }),
      prisma.whitelistApplication.count({ where: { createdAt: { gte: start, lt: end } } })
    ]);
    days.push({ date: start.toISOString().slice(0, 10), users, servers, votes, apps });
  }
  const totals = {
    users: await prisma.user.count(),
    servers: await prisma.server.count(),
    votes: await prisma.vote.count(),
    apps: await prisma.whitelistApplication.count()
  };
  return j({ days, totals });
}
