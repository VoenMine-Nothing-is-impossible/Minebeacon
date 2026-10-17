"use client";
import { useEffect, useState } from "react";
import { ServerCard } from "@/components/ServerCard";
import { useLang } from "@/components/Providers";
export default function Catalog() {
  const { t } = useLang();
  const [items, setItems] = useState<Record<string, never>[]>([]);
  const [q, setQ] = useState(""); const [edition, setEdition] = useState("");
  const [access, setAccess] = useState(""); const [online, setOnline] = useState(false);
  const [sort, setSort] = useState("votes"); const [version, setVersion] = useState("");
  const load = async () => {
    const p = new URLSearchParams({ q, sort, per: "24" });
    if (edition) p.set("edition", edition);
    if (access) p.set("access", access);
    if (online) p.set("online", "1");
    if (version) p.set("version", version);
    const r = await fetch(`/api/servers?${p}`).then(r => r.json()).catch(() => ({ items: [] }));
    setItems(r.items || []);
  };
  useEffect(() => { load(); }, []);
  return (
    <div>
      <h1>{t.catalog}</h1>
      <div className="card">
        <div className="row">
          <input className="input" style={{ maxWidth: 260 }} placeholder={t.search_ph} value={q} onChange={e => setQ(e.target.value)} />
          <input className="input" style={{ maxWidth: 140 }} placeholder="1.20" value={version} onChange={e => setVersion(e.target.value)} />
          <select className="select" style={{ maxWidth: 140 }} value={edition} onChange={e => setEdition(e.target.value)}>
            <option value="">Edition</option><option value="JAVA">Java</option><option value="BEDROCK">Bedrock</option><option value="BOTH">Both</option>
          </select>
          <select className="select" style={{ maxWidth: 140 }} value={access} onChange={e => setAccess(e.target.value)}>
            <option value="">Access</option><option value="PUBLIC">Public</option><option value="PRIVATE">Private</option>
          </select>
          <select className="select" style={{ maxWidth: 140 }} value={sort} onChange={e => setSort(e.target.value)}>
            <option value="votes">Top month</option><option value="total">Top total</option><option value="online">Online</option><option value="new">New</option>
          </select>
          <label><input type="checkbox" checked={online} onChange={e => setOnline(e.target.checked)} /> online</label>
          <button className="btn" onClick={load}>OK</button>
        </div>
      </div>
      <div className="grid">{items.map(s => <ServerCard key={String(s.id)} s={s} />)}</div>
    </div>
  );
}
