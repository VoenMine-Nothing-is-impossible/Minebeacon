export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j, err } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
export async function GET(req: Request) {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return err("forbidden", 403);
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const per = 20;
  const [total, items] = await Promise.all([
    prisma.server.count(),
    prisma.server.findMany({ skip: (page - 1) * per, take: per, orderBy: { createdAt: "desc" }, include: { owner: { select: { login: true } } } })
  ]);
  return j({ total, page, per, items });
}
