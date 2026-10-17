export interface PingResult { online: boolean; playersOnline: number; playersMax: number; motd: string; version: string; }
export async function pingJava(host: string, port = 25565): Promise<PingResult> {
  try {
    const util = await import("minecraft-server-util");
    const res = await util.status(host, port, { timeout: 5000 });
    return {
      online: true,
      playersOnline: res.players?.online ?? 0,
      playersMax: res.players?.max ?? 0,
      motd: (res.motd?.clean || "").slice(0, 500),
      version: (res.version?.name || "").slice(0, 100)
    };
  } catch {
    return { online: false, playersOnline: 0, playersMax: 0, motd: "", version: "" };
  }
}
export function monthKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
