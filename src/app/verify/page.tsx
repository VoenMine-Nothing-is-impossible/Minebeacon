"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
export default function Verify() {
  return <Suspense><VerifyInner /></Suspense>;
}
function VerifyInner() {
  const sp = useSearchParams(); const [msg, setMsg] = useState("…");
  useEffect(() => {
    fetch(`/api/auth/verify?token=${sp.get("token") || ""}`).then(r => r.json()).then(d => setMsg(d.ok ? "E-mail подтверждён / Verified" : "Bad token")).catch(() => setMsg("error"));
  }, []);
  return (<div className="card"><h1>Verify</h1><p>{msg}</p></div>);
}
