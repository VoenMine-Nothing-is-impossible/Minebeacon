export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { newCsrfToken, isSecureCookie, CSRF_COOKIE } from "@/lib/session";
export async function GET() {
  const token = newCsrfToken();
  const res = NextResponse.json({ csrf: token });
  res.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false, secure: isSecureCookie(), sameSite: "lax", path: "/", maxAge: 86400
  });
  return res;
}
