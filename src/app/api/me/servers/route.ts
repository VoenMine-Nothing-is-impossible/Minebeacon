export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j, err } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
export async function GET() {
  const u = await getCurrentUser();
  if (!u) return err("auth", 401);
  const items = await prisma.server.findMany({ where: { ownerId: u.id }, orderBy: { createdAt: "desc" } });
  return j({ items });
}
