export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j, err } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { checkCsrf } from "@/lib/session";
export async function DELETE(req: Request) {
  if (!(await checkCsrf(req))) return err("csrf", 403);
  const u = await getCurrentUser();
  if (!u) return err("auth", 401);
  const { provider } = await req.json().catch(() => ({}));
  if (!provider) return err("invalid_data", 400);
  const accs = await prisma.linkedAccount.findMany({ where: { userId: u.id } });
  const hasPass = !!u.passwordHash;
  if (accs.length <= 1 && !hasPass) return err("last_method", 400);
  await prisma.linkedAccount.deleteMany({ where: { userId: u.id, provider } });
  return j({ ok: true });
}
