export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j, err, ipOf } from "@/lib/api";
import { getCurrentUser, checkCsrf } from "@/lib/session";
import { serverSchema } from "@/lib/validators";
import { mdToHtml } from "@/lib/markdown";
import { audit } from "@/lib/audit";
import { pingJava, monthKey } from "@/lib/mc-ping";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const version = url.searchParams.get("version") || "";
  const edition = url.searchParams.get("edition") || "";
  const access = url.searchParams.get("access") || "";
  const online = url.searchParams.get("online") || "";
  const tag = url.searchParams.get("tag") || "";
  const sort = url.searchParams.get("sort") || "votes";
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const per = Math.min(50, Math.max(1, Number(url.searchParams.get("per") || "12")));
  const where: Record<string, unknown> = { hidden: false };
  if (q) where.OR = [{ name: { contains: q, mode: "insensitive" } }, { shortDesc: { contains: q, mode: "insensitive" } }, { host: { contains: q, mode: "insensitive" } }];
  if (version) where.version = version;
  if (edition && ["JAVA", "BEDROCK", "BOTH"].includes(edition)) where.edition = edition;
  if (access && ["PUBLIC", "PRIVATE"].includes(access)) where.access = access;
  if (online === "1") where.online = true;
  if (tag) where.tags = { has: tag };
  let orderBy: Record<string, string> = { votesMonth: "desc" };
  if (sort === "online") orderBy = { playersOnline: "desc" };
  else if (sort === "new") orderBy = { createdAt: "desc" };
  else if (sort === "total") orderBy = { votesTotal: "desc" };
  const [total, items] = await Promise.all([
    prisma.server.count({ where: where as never }),
    prisma.server.findMany({
      where: where as never, orderBy: orderBy as never,
      skip: (page - 1) * per, take: per,
      select: {
        id: true, name: true, shortDesc: true, logoUrl: true, host: true, port: true,
        edition: true, version: true, tags: true, access: true, online: true,
        playersOnline: true, playersMax: true, votesTotal: true, votesMonth: true,
        featured: true, verified: true, createdAt: true
      }
    })
  ]);
  return j({ total, page, per, items });
}

export async function POST(req: Request) {
  if (!(await checkCsrf(req))) return err("csrf", 403);
  const u = await getCurrentUser();
  if (!u) return err("auth", 401);
  const body = await req.json().catch(() => null);
  const parsed = serverSchema.safeParse(body);
  if (!parsed.success) return err("invalid_data:" + parsed.error.issues[0]?.message, 400);
  const d = parsed.data;
  const count = await prisma.server.count({ where: { ownerId: u.id } });
  if (count >= 20) return err("limit", 403);
  const html = mdToHtml(d.descriptionMd || "");
  const mk = monthKey();
  const srv = await prisma.server.create({
    data: {
      ownerId: u.id, name: d.name.trim(), shortDesc: (d.shortDesc || "").slice(0, 300),
      descriptionMd: d.descriptionMd || "", descriptionHtml: html,
      host: d.host.trim(), port: d.port, bedrockPort: d.bedrockPort ?? null,
      edition: d.edition as never, version: d.version || "", tags: d.tags || [],
      language: d.language || "ru", country: d.country || "",
      website: d.website || null, discord: d.discord || null,
      telegram: d.telegram || null, vk: d.vk || null,
      access: d.access as never, joinRules: d.joinRules || "",
      whitelistQs: d.whitelistQs || [],
      logoUrl: d.logoUrl || null, bannerUrl: d.bannerUrl || null,
      votesMonthKey: mk
    }
  });
  // первичный пинг (не блокируем ответ надолго)
  pingJava(srv.host, srv.port).then(async r => {
    await prisma.server.update({
      where: { id: srv.id },
      data: { online: r.online, playersOnline: r.playersOnline, playersMax: r.playersMax, motd: r.motd, pingVersion: r.version, lastPingAt: new Date() }
    }).catch(() => {});
  }).catch(() => {});
  await audit(u.id, "server_create", "server", srv.id, { name: srv.name }, ipOf(req));
  return j({ ok: true, id: srv.id });
}
