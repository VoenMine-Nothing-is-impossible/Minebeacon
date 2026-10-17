type Entry = { count: number; resetAt: number };
const mem = new Map<string, Entry>();
let redis: import("ioredis").default | null = null;
async function getRedis() {
  if (redis) return redis;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    const { default: IORedis } = await import("ioredis");
    redis = new IORedis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
    await redis.connect().catch(() => null);
    return redis;
  } catch { return null; }
}
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<{ ok: boolean; remaining: number }> {
  const r = await getRedis().catch(() => null);
  if (r) {
    try {
      const count = await r.incr(`rl:${key}`);
      if (count === 1) await r.expire(`rl:${key}`, windowSec);
      const ttl = await r.ttl(`rl:${key}`);
      return { ok: count <= limit, remaining: Math.max(0, limit - count) };
    } catch {}
  }
  const now = Date.now();
  const e = mem.get(key);
  if (!e || e.resetAt < now) {
    mem.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { ok: true, remaining: limit - 1 };
  }
  e.count += 1;
  return { ok: e.count <= limit, remaining: Math.max(0, limit - e.count) };
}
