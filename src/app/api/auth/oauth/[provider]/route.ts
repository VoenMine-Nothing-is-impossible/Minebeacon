export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { appUrl } from "@/lib/session";
import { getSetting } from "@/lib/settings";
export async function GET(_req: Request, { params }: { params: { provider: string } }) {
  const p = params.provider;
  if (p !== "google" && p !== "github") return NextResponse.json({ error: "unknown" }, { status: 404 });
  const enabled = await getSetting(`${p}_enabled`);
  if (enabled !== "1") return NextResponse.json({ error: "disabled" }, { status: 403 });
  const cid = await getSetting(`${p}_client_id`);
  const cb = `${appUrl()}/api/auth/callback/${p}`;
  if (!cid) return NextResponse.json({ error: "not_configured" }, { status: 500 });
  let url = "";
  if (p === "google") {
    const q = new URLSearchParams({
      client_id: cid, redirect_uri: cb, response_type: "code",
      scope: "openid email profile", access_type: "online", prompt: "select_account"
    });
    url = `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
  } else {
    const q = new URLSearchParams({ client_id: cid, redirect_uri: cb, scope: "read:user user:email" });
    url = `https://github.com/login/oauth/authorize?${q}`;
  }
  return NextResponse.redirect(url);
}
