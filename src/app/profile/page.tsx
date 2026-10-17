"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { useLang, useUser } from "@/components/Providers";
export default function Profile() {
  const { t } = useLang(); const { user, reload } = useUser();
  const [servers, setServers] = useState<Record<string, never>[]>([]);
  const [apps, setApps] = useState<Record<string, never>[]>([]);
  const [notifs, setNotifs] = useState<Record<string, never>[]>([]);
  const [pw, setPw] = useState({ old: "", nw: "" }); const [msg, setMsg] = useState("");
  const load = async () => {
    const s = await fetch("/api/me/servers").then(r => r.json()).catch(() => ({ items: [] }));
    setServers(s.items || []);
    const a = await fetch("/api/applications/mine").then(r => r.json()).catch(() => ({ items: [] }));
    setApps(a.items || []);
    const n = await fetch("/api/notifications").then(r => r.json()).catch(() => ({ items: [] }));
    setNotifs(n.items || []);
  };
  useEffect(() => { if (user) load(); }, [user]);
  if (!user) return <p>Войдите / Please log in.</p>;
  const unlink = async (provider: string) => {
    const r = await api("/api/auth/accounts", { method: "DELETE", body: { provider } });
    if (r.ok) reload(); else setMsg(String((r.data as { error?: string })?.error || "error"));
  };
  const changePw = async () => {
    const r = await api("/api/me/password", { method: "POST", body: { oldPassword: pw.old, newPassword: pw.nw } });
    setMsg(r.ok ? "OK (перезайдите)" : String((r.data as { error?: string })?.error || "error"));
  };
  const revoke = async (id: string) => {
    await api(`/api/applications/${id}`, { method: "DELETE" }); load();
  };
  const delServer = async (id: string) => {
    if (!confirm("Delete?")) return;
    await api(`/api/servers/${id}`, { method: "DELETE" }); load();
  };
  return (
    <div>
      <h1>{t.profile}: {user.login}</h1>
      {user.mustChangePass && <div className="card" style={{ borderColor: "var(--warn)" }}>⚠ Смените пароль (требуется) / Please change password.</div>}
      {msg && <p>{msg}</p>}
      <div className="card">
        <h3>Входы / Logins</h3>
        <p>{user.email} · {user.accounts.map(a => a.provider).join(", ") || "password"}</p>
        <div className="row">
          {user.accounts.map(a => <button key={a.provider} className="btn btn-ghost" onClick={() => unlink(a.provider)}>Отвязать {a.provider}</button>)}
        </div>
        <h3>Смена пароля</h3>
        <div className="row">
          <input className="input" type="password" placeholder="old" value={pw.old} onChange={e => setPw({ ...pw, old: e.target.value })} style={{ maxWidth: 180 }} />
          <input className="input" type="password" placeholder="new 8+" value={pw.nw} onChange={e => setPw({ ...pw, nw: e.target.value })} style={{ maxWidth: 180 }} />
          <button className="btn" onClick={changePw}>{t.save}</button>
        </div>
      </div>
      <div className="card">
        <h3>🔔 {t.notifications}</h3>
        {notifs.map(n => <p key={String(n.id)}>• <b>{String(n.title)}</b> — {String(n.body)}</p>)}
        <button className="btn btn-ghost" onClick={async () => { await api("/api/notifications", { method: "POST" }); load(); }}>Прочитано</button>
      </div>
      <h2>{t.my_servers}</h2>
      {servers.map(s => (
        <div className="card" key={String(s.id)}>
          <b><Link href={`/servers/${String(s.id)}`}>{String(s.name)}</Link></b> · ★{Number(s.votesMonth)}
          <div className="row" style={{ marginTop: 6 }}>
            <Link className="btn btn-ghost" href={`/servers/${String(s.id)}/edit`}>{t.edit}</Link>
            <Link className="btn btn-ghost" href={`/servers/${String(s.id)}/applications`}>Заявки</Link>
            <button className="btn btn-danger" onClick={() => delServer(String(s.id))}>{t.delete}</button>
          </div>
        </div>
      ))}
      <h2>{t.my_apps}</h2>
      {apps.map(a => (
        <div className="card" key={String(a.id)}>
          <b>{String((a.server as { name?: string })?.name)}</b> · {String(a.status)} · {String(a.nick)}
          <p>{String(a.comment || "")}</p>
          {String(a.status) === "pending" && <button className="btn btn-ghost" onClick={() => revoke(String(a.id))}>Отозвать</button>}
        </div>
      ))}
    </div>
  );
}
