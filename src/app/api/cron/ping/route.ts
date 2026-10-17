export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j } from "@/lib/api";
import { pingJava, monthKey } from "@/lib/mc-ping";
import { processEmailQueue } from "@/lib/mailer";
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return true; // внутренняя задача docker
  const url = new URL(req.url);
  return req.headers.get("x-cron-secret") === secret || url.searchParams.get("secret") === secret;
}
export async function GET(req: Request) { return POST(req); }
export async function POST(req: Request) {
  if (!authorized(req)) return j({ error: "forbidden" }, 403);
  const mk = monthKey();
  const servers = await prisma.server.findMany({ take: 100, orderBy: { lastPingAt: "asc" } });
  let ok = 0;
  for (const s of servers) {
    try {
      const r = await pingJava(s.host, s.port);
      const data: Record<string, unknown> = {
        online: r.online, playersOnline: r.playersOnline, playersMax: r.playersMax,
        motd: r.motd, pingVersion: r.version, lastPingAt: new Date()
      };
      if (s.votesMonthKey !== mk) { data.votesMonth = 0; data.votesMonthKey = mk; }
      await prisma.server.update({ where: { id: s.id }, data: data as never });
      ok++;
    } catch {}
  }
  let mailed = { sent: 0, failed: 0 };
  try { mailed = await processEmailQueue(20); } catch {}
  return j({ ok: true, pinged: ok, mailed });
}
