"use client";
import Link from "next/link";
import { useLang, useUser, themeToggle } from "./Providers";
import { api } from "@/lib/client";
import { useEffect, useState } from "react";
export function Header() {
  const { t, lang, setLang } = useLang();
  const { user, reload } = useUser();
  const [unread, setUnread] = useState(0);
  const [siteName, setSiteName] = useState("MineBeacon");
  useEffect(() => {
    fetch("/api/settings/public").then(r => r.json()).then(d => {
      if (d.site_name) setSiteName(d.site_name);
    }).catch(() => {});
    if (user) fetch("/api/notifications").then(r => r.json()).then(d => setUnread(d.unread || 0)).catch(() => {});
  }, [user]);
  const logout = async () => { await api("/api/auth/logout", { method: "POST" }); reload(); location.href = "/"; };
  return (
    <header className="header">
      <div className="header-inner">
        <Link className="logo" href="/">⛏ {siteName}</Link>
        <nav className="nav">
          <Link href="/">{t.home}</Link>
          <Link href="/servers">{t.catalog}</Link>
          {user && <Link href="/servers/new">{t.add_server}</Link>}
          {user && <Link href="/profile">{t.profile} ({user.login})</Link>}
          {user?.role === "admin" && <Link href="/admin">{t.admin}</Link>}
          {!user && <Link href="/login">{t.login}</Link>}
          {!user && <Link href="/register">{t.register}</Link>}
          {user && <a href="#" onClick={e => { e.preventDefault(); logout(); }}>{t.logout}</a>}
        </nav>
        <div className="row" style={{ marginLeft: "auto" }}>
          {user && unread > 0 && <span className="badge">🔔 {unread}</span>}
          <button className="btn-ghost btn" onClick={() => themeToggle()}>🌓</button>
          <button className="btn-ghost btn" onClick={() => setLang(lang === "ru" ? "en" : "ru")}>{lang === "ru" ? "EN" : "RU"}</button>
        </div>
      </div>
    </header>
  );
}
