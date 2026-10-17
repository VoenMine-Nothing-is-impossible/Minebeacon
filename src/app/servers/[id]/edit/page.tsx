"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ServerForm } from "@/components/ServerForm";
export default function EditServer() {
  const params = useParams() as { id: string };
  const [init, setInit] = useState<Record<string, never> | null>(null);
  useEffect(() => {
    fetch(`/api/servers/${params.id}`).then(r => r.json()).then(d => setInit(d.server)).catch(() => {});
  }, [params.id]);
  if (!init) return <p>…</p>;
  return (<div><h1>Редактировать</h1><ServerForm initial={init as never} editId={params.id} /></div>);
}
