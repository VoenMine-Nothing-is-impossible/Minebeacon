"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import { useRouter } from "next/navigation";
export interface ServerFormData {
  name: string; shortDesc: string; descriptionMd: string; host: string; port: number;
  bedrockPort?: number | null; edition: string; version: string; tags: string[];
  language: string; country: string; website: string; discord: string; telegram: string; vk: string;
  access: string; joinRules: string; whitelistQs: string[]; logoUrl: string; bannerUrl: string;
}
export const emptyForm: ServerFormData = {
  name: "", shortDesc: "", descriptionMd: "", host: "", port: 25565,
  edition: "JAVA", version: "", tags: [], language: "ru", country: "",
  website: "", discord: "", telegram: "", vk: "", access: "PUBLIC",
  joinRules: "", whitelistQs: [], logoUrl: "", bannerUrl: ""
};
export function ServerForm({ initial, editId }: { initial?: Partial<ServerFormData>; editId?: string }) {
  const [f, setF] = useState<ServerFormData>({ ...emptyForm, ...(initial as object || {}) });
  const [msg, setMsg] = useState("");
  const router = useRouter();
  const set = (k: keyof ServerFormData, v: never) => setF({ ...f, [k]: v } as ServerFormData);
  const upload = async (file: File, kind: string) => {
    const fd = new FormData(); fd.append("file", file); fd.append("kind", kind);
    const t = await (await import("@/lib/client")).ensureCsrf();
    const r = await fetch("/api/upload", { method: "POST", headers: { "x-csrf-token": t }, body: fd });
    const d = await r.json();
    if (d.url) set(kind === "banner" ? "bannerUrl" : "logoUrl", d.url as never);
    else setMsg(d.error || "upload error");
  };
  const submit = async () => {
    const payload = { ...f, tags: typeof f.tags === "string" ? String(f.tags).split(",").map(s => s.trim()).filter(Boolean) : f.tags };
    const r = editId
      ? await api(`/api/servers/${editId}`, { method: "PUT", body: payload })
      : await api("/api/servers", { method: "POST", body: payload });
    if (r.ok) router.push(editId ? `/servers/${editId}` : "/profile");
    else setMsg(String((r.data as { error?: string })?.error || "error"));
  };
  return (
    <div className="card">
      <label className="label">Название / Name</label>
      <input className="input" value={f.name} onChange={e => set("name", e.target.value as never)} />
      <label className="label">Краткое описание</label>
      <input className="input" value={f.shortDesc} onChange={e => set("shortDesc", e.target.value as never)} />
      <label className="label">Описание (Markdown)</label>
      <textarea className="textarea" style={{ minHeight: 160 }} value={f.descriptionMd} onChange={e => set("descriptionMd", e.target.value as never)} />
      <div className="row">
        <div style={{ flex: 1 }}><label className="label">Host/IP</label><input className="input" value={f.host} onChange={e => set("host", e.target.value as never)} /></div>
        <div><label className="label">Port</label><input className="input" type="number" value={f.port} onChange={e => set("port", Number(e.target.value) as never)} /></div>
        <div><label className="label">Bedrock port</label><input className="input" type="number" value={f.bedrockPort || ""} onChange={e => set("bedrockPort", (Number(e.target.value) || null) as never)} /></div>
      </div>
      <div className="row">
        <div><label className="label">Edition</label>
          <select className="select" value={f.edition} onChange={e => set("edition", e.target.value as never)}>
            <option>JAVA</option><option>BEDROCK</option><option>BOTH</option>
          </select></div>
        <div><label className="label">Access</label>
          <select className="select" value={f.access} onChange={e => set("access", e.target.value as never)}>
            <option>PUBLIC</option><option>PRIVATE</option>
          </select></div>
        <div style={{ flex: 1 }}><label className="label">Version</label><input className="input" value={f.version} onChange={e => set("version", e.target.value as never)} /></div>
      </div>
      <label className="label">Теги через запятую (survival, RP, minigames, anarchy...)</label>
      <input className="input" value={Array.isArray(f.tags) ? f.tags.join(",") : String(f.tags || "")} onChange={e => set("tags", e.target.value.split(",").map(s => s.trim()).filter(Boolean) as never)} />
      <div className="row">
        <div><label className="label">Language</label><input className="input" value={f.language} onChange={e => set("language", e.target.value as never)} /></div>
        <div style={{ flex: 1 }}><label className="label">Country</label><input className="input" value={f.country} onChange={e => set("country", e.target.value as never)} /></div>
      </div>
      <div className="row">
        <div style={{ flex: 1 }}><label className="label">Website</label><input className="input" value={f.website} onChange={e => set("website", e.target.value as never)} /></div>
        <div style={{ flex: 1 }}><label className="label">Discord</label><input className="input" value={f.discord} onChange={e => set("discord", e.target.value as never)} /></div>
      </div>
      <div className="row">
        <div style={{ flex: 1 }}><label className="label">Telegram</label><input className="input" value={f.telegram} onChange={e => set("telegram", e.target.value as never)} /></div>
        <div style={{ flex: 1 }}><label className="label">VK</label><input className="input" value={f.vk} onChange={e => set("vk", e.target.value as never)} /></div>
      </div>
      <label className="label">Logo (png/jpg/webp ≤2MB)</label>
      <div className="row"><input type="file" accept="image/*" onChange={e => e.target.files?.[0] && upload(e.target.files[0], "logo")} />
        {f.logoUrl && <img src={f.logoUrl} alt="" width={48} />}</div>
      <label className="label">Banner (≤5MB)</label>
      <div className="row"><input type="file" accept="image/*" onChange={e => e.target.files?.[0] && upload(e.target.files[0], "banner")} />
        {f.bannerUrl && <img src={f.bannerUrl} alt="" width={120} />}</div>
      {f.access === "PRIVATE" && (
        <div>
          <label className="label">Правила вступления</label>
          <textarea className="textarea" value={f.joinRules} onChange={e => set("joinRules", e.target.value as never)} />
          <label className="label">Вопросы анкеты (по одному на строке)</label>
          <textarea className="textarea" value={f.whitelistQs.join("\n")} onChange={e => set("whitelistQs", e.target.value.split("\n").map(s => s.trim()).filter(Boolean) as never)} />
        </div>
      )}
      {msg && <p>{msg}</p>}
      <div style={{ marginTop: 10 }}><button className="btn" onClick={submit}>Сохранить / Save</button></div>
    </div>
  );
}
