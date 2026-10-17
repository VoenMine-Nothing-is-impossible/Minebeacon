export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appUrl, createSession, SESSION_COOKIE, isSecureCookie } from "@/lib/session";
import { getSetting } from "@/lib/settings";
import { audit } from "@/lib/audit";

async function handleGoogle(code: string) {
  const cid = await getSetting("google_client_id");
  const csec = await getSetting("google_client_secret");
  const cb = `${appUrl()}/api/auth/callback/google`;
  const t = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: cid, client_secret: csec, redirect_uri: cb, grant_type: "authorization_code" })
  });
  const tj = await t.json();
  if (!tj.access_token) throw new Error("token exchange failed");
  const u = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { authorization: `Bearer ${tj.access_token}` }
  });
  const uj = await u.json();
  if (!uj.sub) throw new Error("userinfo failed");
  return { id: String(uj.sub), email: String(uj.email || ""), login: String(uj.name || uj.email || "google").replace(/[^a-zA-Z0-9_\-\.]/g, "_").slice(0, 32) };
}
async function handleGithub(code: string) {
  const cid = await getSetting("github_client_id");
  const csec = await getSetting("github_client_secret");
  const cb = `${appUrl()}/api/auth/callback/github`;
  const t = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST", headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ code, client_id: cid, client_secret: csec, redirect_uri: cb })
  });
  const tj = await t.json();
  if (!tj.access_token) throw new Error("token exchange failed");
  const u = await fetch("https://api.github.com/user", { headers: { authorization: `Bearer ${tj.access_token}`, "user-agent": "minebeacon" } });
  const uj = await u.json();
  if (!uj.id) throw new Error("userinfo failed");
  let email = uj.email || "";
  if (!email) {
    try {
      const e = await fetch("https://api.github.com/user/emails", { headers: { authorization: `Bearer ${tj.access_token}`, "user-agent": "minebeacon" } });
      const ej = await e.json();
      email = (Array.isArray(ej) ? (ej.find((x: { primary: boolean }) => x.primary) || ej[0])?.email : "") || "";
    } catch {}
  }
  return { id: String(uj.id), email: String(email || ""), login: String(uj.login || "github").slice(0, 32) };
}

export async function GET(req: Request, { params }: { params: { provider: string } }) {
  const p = params.provider;
  const base = appUrl();
  try {
    if (p !== "google" && p !== "github") throw new Error("unknown");
    const url = new URL(req.url);
    const code = url.searchParams.get("code") || "";
    if (!code) throw new Error("no code");
    const ext = p === "google" ? await handleGoogle(code) : await handleGithub(code);
    // найти linked account
    let acc = await prisma.linkedAccount.findUnique({ where: { provider_providerId: { provider: p, providerId: ext.id } }, include: { user: true } });
    let user = acc?.user || null;
    if (!user) {
      // привязать к текущей сессии? пробуем найти по email
      if (ext.email) {
        const byEmail = await prisma.user.findUnique({ where: { email: ext.email } });
        if (byEmail) user = byEmail;
      }
      if (!user) {
        let login = ext.login || `${p}_user`;
        // уникализация логина
        let i = 0;
        while (await prisma.user.findUnique({ where: { login: i ? `${login}${i}` : login } })) { i++; if (i > 99) break; }
        if (i) login = `${login}${i}`;
        const email = ext.email || `${p}_${ext.id}@example.local`;
        const existsEmail = await prisma.user.findUnique({ where: { email } });
        user = existsEmail || await prisma.user.create({
          data: { login, email, emailVerified: !!ext.email }
        });
      }
      await prisma.linkedAccount.create({
        data: { userId: user.id, provider: p, providerId: ext.id, email: ext.email }
      });
    }
    if (user.blocked) throw new Error("blocked");
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "";
    const token = await createSession(user.id, ip, req.headers.get("user-agent") || "");
    await audit(user.id, `oauth_${p}`, "user", user.id, {}, ip);
    const res = NextResponse.redirect(`${base}/`);
    res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: isSecureCookie(), sameSite: "lax", path: "/", maxAge: 30 * 24 * 3600 });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "oauth failed";
    return NextResponse.redirect(`${base}/login?error=${encodeURIComponent(msg)}`);
  }
}
