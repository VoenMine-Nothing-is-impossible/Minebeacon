"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/client";
export default function ManageApps() {
  const params = useParams() as { id: string };
  const [items, setItems] = useState<Record<string, never>[]>([]);
  const load = async () => {
    const r = await fetch(`/api/servers/${params.id}/applications`).then(r => r.json()).catch(() => ({ items: [] }));
    setItems(r.items || []);
  };
  useEffect(() => { load(); }, []);
  const decide = async (id: string, status: string) => {
    await api(`/api/applications/${id}`, { method: "PUT", body: { status, comment: "" } });
    load();
  };
  const exportWl = async () => {
    const r = await fetch(`/api/servers/${params.id}/whitelist-export`).then(r => r.json()).catch(() => []);
    const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "whitelist.json"; a.click();
  };
  return (
    <div>
      <h1>Заявки</h1>
      <button className="btn btn-ghost" onClick={exportWl}>Экспорт whitelist.json</button>
      {items.map(a => (
        <div className="card" key={String(a.id)}>
          <b>{String(a.nick)}</b> · {String(a.status)} · {String((a.user as { login?: string })?.login || "")}
          <p>{String(a.contact)} {a.age ? `· ${Number(a.age)}` : ""}</p>
          <p style={{ whiteSpace: "pre-wrap" }}>{String(a.message)}</p>
          <p style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(a.answers)}</p>
          <div className="row">
            <button className="btn" onClick={() => decide(String(a.id), "approved")}>Одобрить</button>
            <button className="btn btn-danger" onClick={() => decide(String(a.id), "rejected")}>Отклонить</button>
          </div>
        </div>
      ))}
    </div>
  );
}
