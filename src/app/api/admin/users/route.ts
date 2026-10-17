export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j, err } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
export async function GET(req: Request) {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return err("forbidden", 403);
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const per = 20;
  const where = q ? { OR: [{ login: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }] } : {};
  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where, skip: (page - 1) * per, take: per, orderBy: { createdAt: "desc" },
      select: { id: true, login: true, email: true, role: true, blocked: true, mustChangePass: true, emailVerified: true, createdAt: true }
    })
  ]);
  return j({ total, page, per, items });
}
