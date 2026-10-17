export const dynamic = "force-dynamic";
import { getCurrentUser } from "@/lib/session";
import { j } from "@/lib/api";
import { prisma } from "@/lib/prisma";
export async function GET() {
  const u = await getCurrentUser();
  if (!u) return j({ user: null });
  const accounts = await prisma.linkedAccount.findMany({ where: { userId: u.id } });
  return j({
    user: {
      id: u.id, login: u.login, email: u.email, role: u.role,
      mustChangePass: u.mustChangePass, emailVerified: u.emailVerified,
      createdAt: u.createdAt,
      accounts: accounts.map(a => ({ provider: a.provider, email: a.email }))
    }
  });
}
