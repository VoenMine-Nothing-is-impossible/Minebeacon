"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
type Tab = "stats" | "users" | "servers" | "votes" | "apps" | "audit" | "settings";
export default function Admin() {
  const [tab, setTab] = useState<Tab>("stats");
  return (
    <div>
      <h1>Админка / Admin</h1>
      <div className="tabs">
        {(["stats", "users", "servers", "votes", "apps", "audit", "settings"] as Tab[]).map(x => (
          <button key={x} className={tab === x ? "active" : ""} onClick={() => setTab(x)}>{x}</button>
        ))}
      </div>
      {tab === "stats" && <Stats />}
      {tab === "users" && <Users />}
      {tab === "servers" && <Servers />}
      {tab === "votes" && <Votes />}
      {tab === "apps" && <Apps />}
      {tab === "audit" && <Audit />}
      {tab === "settings" && <Settings />}
    </div>
  );
}
function Stats() {
  const [d, setD] = useState<Record<string, never> | null>(null);
  useEffect(() => { fetch("/api/admin/stats").then(r => r.json()).then(setD).catch(() => {}); }, []);
  if (!d) return <p>…</p>;
  return (<div className="card"><p>Totals: {JSON.stringify(d.totals)}</p>
    <table className="table"><thead><tr><th>date</th><th>users</th><th>servers</th><th>votes</th><th>apps</th></tr></thead>
    <tbody>{((d.days as Record<string, number>[]) || []).map((x, i) => <tr key={i}><td>{x.date}</td><td>{x.users}</td><td>{x.servers}</td><td>{x.votes}</td><td>{x.apps}</td></tr>)}</tbody></table></div>);
}
function Users() {
  const [q, setQ] = useState(""); const [items, setItems] = useState<Record<string, never>[]>([]);
  const load = async () => {
    const r = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`).then(r => r.json()).catch(() => ({ items: [] }));
    setItems(r.items || []);
  };
  useEffect(() => { load(); }, []);
  const upd = async (id: string, body: object) => { await api(`/api/admin/users/${id}`, { method: "PUT", body }); load(); };
  const del = async (id: string) => { if (confirm("Delete user?")) { await api(`/api/admin/users/${id}`, { method: "DELETE" }); load(); } };
  return (<div>
    <div className="row"><input className="input" style={{ maxWidth: 240 }} value={q} onChange={e => setQ(e.target.value)} placeholder="search" /><button className="btn" onClick={load}>OK</button></div>
    {items.map(u => (
      <div className="card" key={String(u.id)}>
        <b>{String(u.login)}</b> · {String(u.email)} · {String(u.role)} {u.blocked ? "· BLOCKED" : ""}
        <div className="row" style={{ marginTop: 6 }}>
          <button className="btn btn-ghost" onClick={() => upd(String(u.id), { blocked: !u.blocked })}>{u.blocked ? "Разблокировать" : "Блокировать"}</button>
          <button className="btn btn-ghost" onClick={() => upd(String(u.id), { role: u.role === "admin" ? "user" : "admin" })}>role→{u.role === "admin" ? "user" : "admin"}</button>
          <button className="btn btn-ghost" onClick={() => { const p = prompt("Новый пароль:"); if (p) upd(String(u.id), { newPassword: p }); }}>Сброс пароля</button>
          <button className="btn btn-danger" onClick={() => del(String(u.id))}>Удалить</button>
        </div>
      </div>))}
  </div>);
}
function Servers() {
  const [items, setItems] = useState<Record<string, never>[]>([]);
  const load = async () => {
    const r = await fetch("/api/admin/servers").then(r => r.json()).catch(() => ({ items: [] }));
    setItems(r.items || []);
  };
  useEffect(() => { load(); }, []);
  const act = async (id: string, action: string, value?: boolean) => {
    await api(`/api/admin/servers/${id}/reset-votes`, { method: "POST", body: { action, value } }); load();
  };
  return (<div>{items.map(s => (
    <div className="card" key={String(s.id)}>
      <b>{String(s.name)}</b> · {(s.owner as { login?: string })?.login} {s.hidden ? "· HIDDEN" : ""} {s.featured ? "· FEATURED" : ""} ★{Number(s.votesMonth)}/{Number(s.votesTotal)}
      <div className="row" style={{ marginTop: 6 }}>
        <button className="btn btn-ghost" onClick={() => act(String(s.id), s.hidden ? "show" : "hide")}>{s.hidden ? "Показать" : "Скрыть"}</button>
        <button className="btn btn-ghost" onClick={() => act(String(s.id), "feature", !s.featured)}>Featured</button>
        <button className="btn btn-ghost" onClick={() => act(String(s.id), "verify", !s.verified)}>Verify</button>
        <button className="btn btn-ghost" onClick={() => act(String(s.id), "reset-votes")}>Сброс голосов</button>
        <button className="btn btn-danger" onClick={() => { if (confirm("Delete?")) act(String(s.id), "delete"); }}>Удалить</button>
      </div>
    </div>))}</div>);
}
function Votes() {
  const [items, setItems] = useState<Record<string, never>[]>([]);
  const [sel, setSel] = useState<string[]>([]);
  const load = async () => {
    const r = await fetch("/api/admin/votes").then(r => r.json()).catch(() => ({ items: [] }));
    setItems(r.items || []); setSel([]);
  };
  useEffect(() => { load(); }, []);
  const bulk = async (block: boolean) => {
    await api("/api/admin/votes", { method: "DELETE", body: { ids: sel, block } }); load();
  };
  return (<div>
    <div className="row"><button className="btn btn-ghost" onClick={() => bulk(true)}>Заблокировать выбранные</button>
    <button className="btn btn-danger" onClick={() => bulk(false)}>Удалить выбранные</button></div>
    {items.map(v => (
      <div className="card" key={String(v.id)}>
        <input type="checkbox" checked={sel.includes(String(v.id))} onChange={e => setSel(e.target.checked ? [...sel, String(v.id)] : sel.filter(x => x !== String(v.id)))} />
        {" "}{(v.server as { name?: string })?.name} · {(v.user as { login?: string })?.login} · {String(v.ip)} · {String(v.createdAt)} {v.blocked ? "· BLOCKED" : ""}
      </div>))}</div>);
}
function Apps() {
  const [items, setItems] = useState<Record<string, never>[]>([]);
  const load = async () => {
    const r = await fetch("/api/admin/applications").then(r => r.json()).catch(() => ({ items: [] }));
    setItems(r.items || []);
  };
  useEffect(() => { load(); }, []);
  const decide = async (id: string, status: string) => { await api(`/api/applications/${id}`, { method: "PUT", body: { status } }); load(); };
  return (<div>{items.map(a => (
    <div className="card" key={String(a.id)}>
      <b>{String(a.nick)}</b> · {(a.server as { name?: string })?.name} · {String(a.status)}
      <div className="row"><button className="btn" onClick={() => decide(String(a.id), "approved")}>Approve</button>
      <button className="btn btn-danger" onClick={() => decide(String(a.id), "rejected")}>Reject</button></div>
    </div>))}</div>);
}
function Audit() {
  const [items, setItems] = useState<Record<string, never>[]>([]);
  useEffect(() => { fetch("/api/admin/audit").then(r => r.json()).then(d => setItems(d.items || [])).catch(() => {}); }, []);
  return (<div className="card"><table className="table"><thead><tr><th>time</th><th>actor</th><th>action</th><th>entity</th></tr></thead>
    <tbody>{items.map((a, i) => <tr key={i}><td>{String(a.createdAt)}</td><td>{String((a.actor as { login?: string })?.login || "")}</td><td>{String(a.action)}</td><td>{String(a.entity)} {String(a.entityId)}</td></tr>)}</tbody></table></div>);
}
const SETTING_GROUPS: { title: string; keys: string[] }[] = [
  { title: "Общие", keys: ["site_name", "site_desc", "contact_email", "registration_enabled"] },
  { title: "Google", keys: ["google_enabled", "google_client_id", "google_client_secret"] },
  { title: "GitHub", keys: ["github_enabled", "github_client_id", "github_client_secret"] },
  { title: "Telegram", keys: ["telegram_enabled", "telegram_bot_name", "telegram_bot_token"] },
  { title: "SMTP", keys: ["smtp_host", "smtp_port", "smtp_enc", "smtp_user", "smtp_pass", "smtp_from", "smtp_from_name"] },
  { title: "Уведомления", keys: ["notify_new_app", "notify_status_change", "tpl_new_app_subject", "tpl_new_app_body", "tpl_status_subject", "tpl_status_body"] },
  { title: "Голосование", keys: ["vote_interval_h", "captcha_enabled", "turnstile_site_key", "turnstile_secret_key", "vote_limit_per_ip_day"] }
];
function Settings() {
  const [s, setS] = useState<Record<string, string>>({});
  const [cb, setCb] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [g, setG] = useState(0);
  const load = async () => {
    const r = await fetch("/api/admin/settings").then(r => r.json()).catch(() => null);
    if (r?.settings) setS(r.settings);
    if (r?.callbackUrls) setCb(r.callbackUrls);
  };
  useEffect(() => { load(); }, []);
  const save = async () => {
    const r = await api("/api/admin/settings", { method: "PUT", body: s });
    setMsg(r.ok ? "Saved" : "Error");
  };
  const testSmtp = async () => {
    const r = await api("/api/admin/settings/test-smtp", { method: "POST", body: {} });
    setMsg(r.ok && (r.data as { ok?: boolean })?.ok ? "SMTP OK" : "SMTP error: " + JSON.stringify(r.data));
  };
  return (
    <div>
      <div className="tabs">{SETTING_GROUPS.map((x, i) => <button key={x.title} className={g === i ? "active" : ""} onClick={() => setG(i)}>{x.title}</button>)}</div>
      <div className="card">
        <h3>{SETTING_GROUPS[g].title}</h3>
        {SETTING_GROUPS[g].keys.map(k => (
          <div key={k}><label className="label">{k} {k.includes("secret") || k.includes("token") || k === "smtp_pass" ? "(секрет: пустое поле = не менять)" : ""}</label>
          <input className="input" value={s[k] || ""} onChange={e => setS({ ...s, [k]: e.target.value })} /></div>
        ))}
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn" onClick={save}>Сохранить</button>
          {SETTING_GROUPS[g].title === "SMTP" && <button className="btn btn-ghost" onClick={testSmtp}>Отправить тестовое письмо</button>}
        </div>
        {msg && <p>{msg}</p>}
        <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>
          <p>Google callback: <code>{cb.google}</code></p>
          <p>GitHub callback: <code>{cb.github}</code></p>
          <p>Telegram: {cb.telegram_note}. BotFather: /setdomain → домен из APP_URL. Включите виджет: укажите username бота и токен.</p>
          <p>Google: console.cloud.google.com → OAuth Client (Web) → Authorized redirect URI = callback выше. GitHub: Settings → Developer settings → OAuth App → Authorization callback URL = callback выше.</p>
          <p>SMTP: хост/порт/шифрование none-STARTTLS-SSL. Письма идут через очередь (cron каждые 2 мин + сразу при ping-задаче).</p>
        </div>
      </div>
    </div>
  );
}
