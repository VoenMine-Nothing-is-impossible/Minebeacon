import { NextResponse } from "next/server";
import { getCurrentUser, checkCsrf, getClientIp } from "@/lib/session";
export function j(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
export async function mustUser() {
  const u = await getCurrentUser();
  return u;
}
export async function mustAdmin() {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return null;
  return u;
}
export async function csrfFail(req: Request) {
  const ok = await checkCsrf(req);
  return !ok;
}
export function ipOf(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "";
}
export async function verifyCaptchaIfEnabled(token: string | undefined, ip: string): Promise<boolean> {
  const { getSetting } = await import("@/lib/settings");
  const enabled = await getSetting("captcha_enabled");
  if (enabled !== "1") return true;
  const secret = await getSetting("turnstile_secret_key");
  if (!secret || !token) return false;
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip })
    });
    const data = await r.json();
    return !!data.success;
  } catch { return false; }
}
