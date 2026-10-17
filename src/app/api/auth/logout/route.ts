export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j } from "@/lib/api";
import { getSessionToken, clearSessionCookies } from "@/lib/session";
export async function POST() {
  const token = await getSessionToken();
  if (token) await prisma.session.delete({ where: { token } }).catch(() => {});
  clearSessionCookies();
  return j({ ok: true });
}
