export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j, err, ipOf } from "@/lib/api";
import { getCurrentUser, checkCsrf } from "@/lib/session";
import { audit } from "@/lib/audit";
import { queueEmail, renderTpl } from "@/lib/mailer";
import { getSetting } from "@/lib/settings";

export async function PUT(req: Request, { params }: { params: { appId: string } }) {
  if (!(await checkCsrf(req))) return err("csrf", 403);
  const u = await getCurrentUser();
  if (!u) return err("auth", 401);
  const app = await prisma.whitelistApplication.findUnique({
    where: { id: params.appId }, include: { server: true, user: true }
  });
  if (!app) return err("not_found", 404);
  const isOwner = app.server.ownerId === u.id;
  const isAdmin = u.role === "admin";
  if (!isOwner && !isAdmin) return err("forbidden", 403);
  const { status, comment } = await req.json().catch(() => ({}));
  if (!["approved", "rejected"].includes(status)) return err("invalid_data", 400);
  await prisma.whitelistApplication.update({
    where: { id: app.id }, data: { status, comment: String(comment || "").slice(0, 1000) }
  });
  await prisma.notification.create({
    data: { userId: app.userId, title: `Заявка ${status === "approved" ? "одобрена" : "отклонена"}: ${app.server.name}`, body: String(comment || "") }
  });
  const notify = await getSetting("notify_status_change");
  if (notify === "1" && app.user.email) {
    const vars = { server_name: app.server.name, player_nick: app.nick, contact: app.contact, status, comment: String(comment || "") };
    await queueEmail(app.user.email, renderTpl(await getSetting("tpl_status_subject"), vars), renderTpl(await getSetting("tpl_status_body"), vars));
  }
  await audit(u.id, `app_${status}`, "application", app.id, {}, ipOf(req));
  return j({ ok: true });
}
export async function DELETE(req: Request, { params }: { params: { appId: string } }) {
  if (!(await checkCsrf(req))) return err("csrf", 403);
  const u = await getCurrentUser();
  if (!u) return err("auth", 401);
  const app = await prisma.whitelistApplication.findUnique({ where: { id: params.appId }, include: { server: true } });
  if (!app) return err("not_found", 404);
  const can = app.userId === u.id || app.server.ownerId === u.id || u.role === "admin";
  if (!can) return err("forbidden", 403);
  if (app.userId === u.id && app.status !== "pending") return err("not_pending", 400);
  await prisma.whitelistApplication.delete({ where: { id: app.id } });
  await audit(u.id, "app_delete", "application", app.id, {}, ipOf(req));
  return j({ ok: true });
}
