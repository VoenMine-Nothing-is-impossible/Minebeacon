export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j } from "@/lib/api";
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return j({ ok: true, service: "minebeacon" });
  } catch (e) {
    return j({ ok: false }, 500);
  }
}
