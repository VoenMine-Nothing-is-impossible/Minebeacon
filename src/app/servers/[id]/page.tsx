"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/client";
import { useLang, useUser } from "@/components/Providers";
export default function ServerPage() {
  const params = useParams() as { id: string };
  const { t } = useLang(); const { user } = useUser();
  const [s, setS] = useState<Record<string, never> | null>(null);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ nick: "", contact: "", message: "", answers: [] as string[] });
  const load = async () => {
    const r = await fetch(`/api/servers/${params.id}`).then(r => r.json()).catch(() => null);
    if (r?.server) setS(r.server);
  };
  useEffect(() => { load(); }, [params.id]);
  if (!s) return <p>…</p>;
  const vote = async () => {
    setMsg("");
    const r = await api(`/api/servers/${params.id}/vote`, { method: "POST", body: {} });
    setMsg(r.ok ? t.voted : String((r.data as { error?: string })?.error || "error"));
    load();
  };
  const copy = async () => {
    await navigator.clipboard.writeText(`${String(s.host)}:${Number(s.port)}`).catch(() => {});
    setMsg(t.copied);
  };
  const apply = async () => {
    const r = await api(`/api/servers/${params.id}/applications`, {
      method: "POST",
      body: { nick: form.nick, contact: form.contact, message: form.message, answers: form.answers }
    });
    setMsg(r.ok ? "OK" : String((r.data as { error?: string })?.error || "error"));
  };
  const qs: string[] = Array.isArray(s.whitelistQs) ? s.whitelistQs as string[] : [];
  return (
    <div>
      {(s.bannerUrl as string) && <img src={String(s.bannerUrl)} alt="" style={{ width: "100%", borderRadius: 12 }} />}
      <h1>{String(s.name)} {(s.verified as boolean) && "✓"}</h1>
      <div className="row">
        {(s.online as boolean) ? <span className="badge badge-on">● {t.online} {Number(s.playersOnline)}/{Number(s.playersMax)}</span>
          : <span className="badge badge-off">○ {t.offline}</span>}
        <span className="badge">{String(s.host)}:{Number(s.port)}</span>
        <span className="badge">★ {Number(s.votesMonth)} / {Number(s.votesTotal)}</span>
        <span className="badge">{String(s.edition)} · {String(s.version)}</span>
        <span className="badge">{String(s.access)}</span>
      </div>
      <div className="row" style={{ margin: "12px 0" }}>
        <button className="btn" onClick={vote} disabled={!user}>{t.vote}</button>
        <button className="btn btn-ghost" onClick={copy}>{t.copy_ip}</button>
        {user && <a className="btn btn-ghost" href={`/servers/${params.id}/edit`}>{t.edit}</a>}
      </div>
      {msg && <p>{msg}</p>}
      {String(s.motd || "") && <p style={{ color: "var(--muted)" }}>{String(s.motd)}</p>}
      <div className="card"><div className="md-body" dangerouslySetInnerHTML={{ __html: String(s.descriptionHtml || "") }} /></div>
      {(s.access as string) === "PRIVATE" && (
        <div className="card">
          <h3>{t.apply}</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{String(s.joinRules || "")}</p>
          {!user && <p>Войдите, чтобы подать заявку / Please log in.</p>}
          {user && (
            <div>
              <label className="label">{t.nick}</label>
              <input className="input" value={form.nick} onChange={e => setForm({ ...form, nick: e.target.value })} />
              <label className="label">{t.contact}</label>
              <input className="input" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
              {qs.map((q, i) => (
                <div key={i}>
                  <label className="label">{q}</label>
                  <input className="input" value={form.answers[i] || ""} onChange={e => {
                    const a = [...form.answers]; a[i] = e.target.value; setForm({ ...form, answers: a });
                  }} />
                </div>
              ))}
              <label className="label">{t.message}</label>
              <textarea className="textarea" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              <div style={{ marginTop: 8 }}><button className="btn" onClick={apply}>{t.apply}</button></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
