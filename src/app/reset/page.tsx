"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/client";
export default function Reset() {
  return <Suspense><ResetInner /></Suspense>;
}
function ResetInner() {
  const sp = useSearchParams();
  const [pw, setPw] = useState(""); const [msg, setMsg] = useState("");
  const go = async () => {
    const r = await api("/api/auth/reset", { method: "POST", body: { token: sp.get("token") || "", password: pw } });
    setMsg(r.ok ? "OK" : String((r.data as { error?: string })?.error || "error"));
  };
  return (<div className="card" style={{ maxWidth: 440 }}><h1>Новый пароль / New password</h1>
    <input className="input" type="password" value={pw} onChange={e => setPw(e.target.value)} />
    {msg && <p>{msg}</p>}<div style={{ marginTop: 8 }}><button className="btn" onClick={go}>OK</button></div></div>);
}
