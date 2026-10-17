/** ensure-admin.js — создаёт админа из ADMIN_LOGIN/ADMIN_PASSWORD (хеш bcrypt). */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
async function main() {
  const login = process.env.ADMIN_LOGIN || "Rudenis";
  const password = process.env.ADMIN_PASSWORD || "";
  if (!password) { console.log("[seed] ADMIN_PASSWORD empty, skip"); return; }
  const prisma = new PrismaClient();
  try {
    const email = `${login.toLowerCase()}@example.local`;
    let user = await prisma.user.findUnique({ where: { login } });
    const hash = await bcrypt.hash(password, 12);
    if (!user) {
      const byEmail = await prisma.user.findUnique({ where: { email } }).catch(() => null);
      if (byEmail) {
        user = await prisma.user.update({ where: { id: byEmail.id }, data: { login, passwordHash: hash, role: "admin", mustChangePass: true, emailVerified: true } });
      } else {
        user = await prisma.user.create({ data: { login, email, passwordHash: hash, role: "admin", mustChangePass: true, emailVerified: true } });
      }
      console.log(`[seed] admin created: ${login}`);
    } else if (user.role !== "admin") {
      await prisma.user.update({ where: { id: user.id }, data: { role: "admin", mustChangePass: true } });
      console.log("[seed] user promoted to admin");
    } else {
      console.log("[seed] admin exists, password NOT overwritten (смените в кабинете/админке)");
    }
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(e => { console.error(e); process.exit(1); });
