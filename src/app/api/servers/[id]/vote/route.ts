export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j, err, ipOf, verifyCaptchaIfEnabled } from "@/lib/api";
import { getCurrentUser, checkCsrf } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { getSetting } from "@/lib/settings";
import { audit } from "@/lib/audit";
import { monthKey } from "@/lib/mc-ping";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!(await checkCsrf(req))) return err("csrf", 403);
  const u = await getCurrentUser();
  if (!u) return err("auth", 401);
  const ip = ipOf(req);
  const rl = await rateLimit(`vote:${ip}`, 30, 3600);
  if (!rl.ok) return err("rate_limited", 429);
  const s = await prisma.server.findUnique({ where: { id: params.id } });
  if (!s || s.hidden) return err("not_found", 404);
  if (s.ownerId === u.id) return err("own_server", 403);
  const body = await req.json().catch(() => ({}));
  const captchaOk = await verifyCaptchaIfEnabled(body?.captcha, ip);
  if (!captchaOk) return err("captcha", 400);
  const intervalH = Number((await getSetting("vote_interval_h")) || "24");
  const since = new Date(Date.now() - intervalH * 3600 * 1000);
  const last = await prisma.vote.findFirst({
    where: { serverId: s.id, userId: u.id, createdAt: { gte: since }, blocked: false },
    orderBy: { createdAt: "desc" }
  });
  if (last) return err("too_soon", 429);
  const mk = monthKey();
  await prisma.$transaction([
    prisma.vote.create({ data: { serverId: s.id, userId: u.id, ip, monthKey: mk } }),
    prisma.server.update({
      where: { id: s.id },
      data: s.votesMonthKey === mk
        ? { votesTotal: { increment: 1 }, votesMonth: { increment: 1 } }
        : { votesTotal: { increment: 1 }, votesMonth: 1, votesMonthKey: mk }
    })
  ]);
  await audit(u.id, "vote", "server", s.id, {}, ip);
  return j({ ok: true });
}
