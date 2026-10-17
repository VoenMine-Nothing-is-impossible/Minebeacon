import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { prisma } from "./prisma";

export const SESSION_COOKIE = "mb_session";
export const CSRF_COOKIE = "mb_csrf";

export function appUrl(): string {
  return (process.env.APP_URL || "http://localhost:8096").replace(/\/$/, "");
}
export function isSecureCookie(): boolean {
  return appUrl().startsWith("https://");
}
export async function createSession(userId: string, ip?: string, ua?: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  await prisma.session.create({ data: { token, userId, ip: ip || "", userAgent: ua || "", expiresAt } });
  return token;
}
export function setSessionCookies(token: string) {
  const secure = isSecureCookie();
  const c = cookies();
  c.set(SESSION_COOKIE, token, {
    httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 30 * 24 * 3600
  });
}
export function clearSessionCookies() {
  const c = cookies();
  c.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}
export async function getSessionToken(): Promise<string | null> {
  try {
    return cookies().get(SESSION_COOKIE)?.value || null;
  } catch { return null; }
}
export async function getCurrentUser() {
  const token = await getSessionToken();
  if (!token) return null;
  const s = await prisma.session.findUnique({ where: { token }, include: { user: true } });
  if (!s) return null;
  if (s.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { token } }).catch(() => {});
    return null;
  }
  if (s.user.blocked) return null;
  return s.user;
}
export function getClientIp(): string {
  try {
    const h = headers();
    const xff = h.get("x-forwarded-for");
    if (xff) return xff.split(",")[0].trim();
    return h.get("x-real-ip") || "";
  } catch { return ""; }
}
// CSRF: double submit. GET /api/auth/csrf выдаёт токен и ставит cookie.
export async function checkCsrf(req: Request): Promise<boolean> {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return true;
  const cookieHeader = req.headers.get("cookie") || "";
  const m = cookieHeader.match(/(?:^|;\s*)mb_csrf=([^;]+)/);
  const cookieToken = m ? decodeURIComponent(m[1]) : "";
  const headerToken = req.headers.get("x-csrf-token") || "";
  if (!cookieToken || !headerToken) return false;
  return crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));
}
export function newCsrfToken(): string {
  return crypto.randomBytes(16).toString("hex");
}
