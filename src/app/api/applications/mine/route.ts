export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j, err, ipOf } from "@/lib/api";
import { getCurrentUser, checkCsrf } from "@/lib/session";
import { audit } from "@/lib/audit";
import { queueEmail, renderTpl } from "@/lib/mailer";
import { getSetting } from "@/lib/settings";

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return err("auth", 401);
  const items = await prisma.whitelistApplication.findMany({
    where: { userId: u.id }, orderBy: { createdAt: "desc" }, take: 200,
    include: { server: { select: { id: true, name: true } } }
  });
  return j({ items });
}
