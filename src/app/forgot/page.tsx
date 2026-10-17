"use client";
import { useState } from "react";
import { api } from "@/lib/client";
export default function Forgot() {
  const [email, setEmail] = useState(""); const [msg, setMsg] = useState("");
  const go = async () => {
    const r = await api("/api/auth/forgot", { method: "POST", body: { email } });
    setMsg(r.ok ? "OK" : "error");
  };
  return (<div className="card" style={{ maxWidth: 440 }}><h1>Восстановление / Forgot</h1>
    <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="e-mail" />
    {msg && <p>{msg}</p>}<div style={{ marginTop: 8 }}><button className="btn" onClick={go}>OK</button></div></div>);
}
