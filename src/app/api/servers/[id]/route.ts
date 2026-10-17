export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j, err, ipOf } from "@/lib/api";
import { getCurrentUser, checkCsrf } from "@/lib/session";
import { serverSchema } from "@/lib/validators";
import { mdToHtml } from "@/lib/markdown";
import { audit } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const s = await prisma.server.findUnique({ where: { id: params.id }, include: { owner: { select: { login: true } } } });
  if (!s || s.hidden) {
    // владелец и админ могут видеть скрытый
    const u = await getCurrentUser();
    if (!s) return err("not_found", 404);
    if (!u || (u.id !== s.ownerId && u.role !== "admin")) return err("not_found", 404);
  }
  return j({ server: s });
}
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!(await checkCsrf(req))) return err("csrf", 403);
  const u = await getCurrentUser();
  if (!u) return err("auth", 401);
  const s = await prisma.server.findUnique({ where: { id: params.id } });
  if (!s) return err("not_found", 404);
  if (s.ownerId !== u.id && u.role !== "admin") return err("forbidden", 403);
  const body = await req.json().catch(() => null);
  const parsed = serverSchema.safeParse(body);
  if (!parsed.success) return err("invalid_data", 400);
  const d = parsed.data;
  const html = mdToHtml(d.descriptionMd || "");
  await prisma.server.update({
    where: { id: s.id },
    data: {
      name: d.name.trim(), shortDesc: (d.shortDesc || "").slice(0, 300),
      descriptionMd: d.descriptionMd || "", descriptionHtml: html,
      host: d.host.trim(), port: d.port, bedrockPort: d.bedrockPort ?? null,
      edition: d.edition as never, version: d.version || "", tags: d.tags || [],
      language: d.language || "ru", country: d.country || "",
      website: d.website || null, discord: d.discord || null,
      telegram: d.telegram || null, vk: d.vk || null,
      access: d.access as never, joinRules: d.joinRules || "",
      whitelistQs: d.whitelistQs || [],
      logoUrl: d.logoUrl || null, bannerUrl: d.bannerUrl || null
    }
  });
  await audit(u.id, "server_update", "server", s.id, {}, ipOf(req));
  return j({ ok: true });
}
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!(await checkCsrf(req))) return err("csrf", 403);
  const u = await getCurrentUser();
  if (!u) return err("auth", 401);
  const s = await prisma.server.findUnique({ where: { id: params.id } });
  if (!s) return err("not_found", 404);
  if (s.ownerId !== u.id && u.role !== "admin") return err("forbidden", 403);
  await prisma.server.delete({ where: { id: s.id } });
  await audit(u.id, "server_delete", "server", s.id, { name: s.name }, ipOf(req));
  return j({ ok: true });
}
