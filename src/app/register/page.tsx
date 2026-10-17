"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import { useLang } from "@/components/Providers";
export default function Register() {
  const { t } = useLang();
  const [login, setLogin] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const go = async () => {
    const r = await api("/api/auth/register", { method: "POST", body: { login, email, password } });
    setMsg(r.ok ? "OK. Проверьте почту / Check email." : String((r.data as { error?: string })?.error || "error"));
  };
  return (
    <div className="card" style={{ maxWidth: 440 }}>
      <h1>{t.register}</h1>
      <label className="label">Login</label><input className="input" value={login} onChange={e => setLogin(e.target.value)} />
      <label className="label">{t.email}</label><input className="input" value={email} onChange={e => setEmail(e.target.value)} />
      <label className="label">{t.password} (8+)</label><input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      {msg && <p>{msg}</p>}
      <div style={{ marginTop: 10 }}><button className="btn" onClick={go}>{t.do_register}</button></div>
    </div>
  );
}
