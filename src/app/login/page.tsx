"use client";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { useLang, useUser } from "@/components/Providers";
import { useRouter, useSearchParams } from "next/navigation";
export default function Login() {
  return <Suspense><LoginInner /></Suspense>;
}
function LoginInner() {
  const { t } = useLang(); const { reload } = useUser();
  const [login, setLogin] = useState(""); const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(""); const [pub, setPub] = useState<Record<string, never>>({});
  const router = useRouter(); const sp = useSearchParams();
  useEffect(() => {
    fetch("/api/settings/public").then(r => r.json()).then(setPub).catch(() => {});
    const e = sp.get("error"); if (e) setMsg(e);
  }, []);
  const doLogin = async () => {
    const r = await api("/api/auth/login", { method: "POST", body: { login, password } });
    if (r.ok) { reload(); router.push("/"); } else setMsg(String((r.data as { error?: string })?.error || "error"));
  };
  return (
    <div className="card" style={{ maxWidth: 440 }}>
      <h1>{t.login}</h1>
      <label className="label">{t.login_or_email}</label>
      <input className="input" value={login} onChange={e => setLogin(e.target.value)} />
      <label className="label">{t.password}</label>
      <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      {msg && <p>{msg}</p>}
      <div style={{ marginTop: 10 }} className="row">
        <button className="btn" onClick={doLogin}>{t.do_login}</button>
        <a href="/forgot">{t.forgot}</a>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        {pub.google_enabled && <a className="btn btn-ghost" href="/api/auth/oauth/google">Google</a>}
        {pub.github_enabled && <a className="btn btn-ghost" href="/api/auth/oauth/github">GitHub</a>}
      </div>
      {pub.telegram_enabled && <TelegramButton bot={String(pub.telegram_bot_name || "")} />}
    </div>
  );
}
function TelegramButton({ bot }: { bot: string }) {
  useEffect(() => {
    (window as unknown as { onTelegramAuth?: (u: unknown) => void }).onTelegramAuth = async (u) => {
      await api("/api/auth/telegram", { method: "POST", body: u as object });
      location.href = "/";
    };
    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-widget.js?22";
    s.async = true;
    s.setAttribute("data-telegram-login", bot);
    s.setAttribute("data-size", "large");
    s.setAttribute("data-onauth", "onTelegramAuth(user)");
    document.getElementById("tg-login")?.appendChild(s);
  }, [bot]);
  if (!bot) return null;
  return <div id="tg-login" style={{ marginTop: 10 }} />;
}
