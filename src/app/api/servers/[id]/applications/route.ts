export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j, err, ipOf } from "@/lib/api";
import { getCurrentUser, checkCsrf } from "@/lib/session";
import { appSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";
import { queueEmail, renderTpl } from "@/lib/mailer";
import { getSetting } from "@/lib/settings";

// GET — список заявок (владелец/админ), POST — создать заявку
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const u = await getCurrentUser();
  if (!u) return err("auth", 401);
  const s = await prisma.server.findUnique({ where: { id: params.id } });
  if (!s) return err("not_found", 404);
  if (s.ownerId !== u.id && u.role !== "admin") return err("forbidden", 403);
  const items = await prisma.whitelistApplication.findMany({
    where: { serverId: s.id }, orderBy: { createdAt: "desc" }, take: 500,
    include: { user: { select: { login: true, email: true } } }
  });
  return j({ items });
}
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!(await checkCsrf(req))) return err("csrf", 403);
  const u = await getCurrentUser();
  if (!u) return err("auth", 401);
  const s = await prisma.server.findUnique({ where: { id: params.id }, include: { owner: true } });
  if (!s) return err("not_found", 404);
  if (s.access !== "PRIVATE") return err("not_private", 400);
  if (s.ownerId === u.id) return err("own_server", 403);
  const body = await req.json().catch(() => null);
  const parsed = appSchema.safeParse(body);
  if (!parsed.success) return err("invalid_data", 400);
  const active = await prisma.whitelistApplication.findFirst({
    where: { serverId: s.id, userId: u.id, status: "pending" }
  });
  if (active) return err("already_pending", 409);
  const d = parsed.data;
  const app = await prisma.whitelistApplication.create({
    data: {
      serverId: s.id, userId: u.id, nick: d.nick, age: d.age ?? null,
      contact: d.contact || "", answers: d.answers || [], message: d.message || ""
    }
  });
  await prisma.notification.create({
    data: { userId: s.ownerId, title: `Новая заявка: ${s.name}`, body: `Игрок ${d.nick} подал заявку.` }
  });
  const notify = await getSetting("notify_new_app");
  if (notify === "1" && s.owner.email) {
    const subj = renderTpl(await getSetting("tpl_new_app_subject"), { server_name: s.name, player_nick: d.nick, contact: d.contact, status: "pending", comment: "" });
    const bdy = renderTpl(await getSetting("tpl_new_app_body"), { server_name: s.name, player_nick: d.nick, contact: d.contact, status: "pending", comment: "" });
    await queueEmail(s.owner.email, subj, bdy);
  }
  await audit(u.id, "app_create", "application", app.id, { server: s.id }, ipOf(req));
  return j({ ok: true, id: app.id });
}
