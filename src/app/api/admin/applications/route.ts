export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j, err } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
export async function GET(req: Request) {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return err("forbidden", 403);
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "";
  const where = status ? { status: status as never } : {};
  const items = await prisma.whitelistApplication.findMany({
    where, take: 200, orderBy: { createdAt: "desc" },
    include: { server: { select: { name: true } }, user: { select: { login: true } } }
  });
  return j({ items });
}
