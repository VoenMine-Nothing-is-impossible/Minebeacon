"use client";
import { useEffect, useState } from "react";
import { ServerCard } from "@/components/ServerCard";
import { useLang } from "@/components/Providers";
import Link from "next/link";
export default function Home() {
  const { t } = useLang();
  const [top, setTop] = useState<Record<string, never>[]>([]);
  useEffect(() => {
    fetch("/api/servers?sort=votes&per=6").then(r => r.json()).then(d => setTop(d.items || [])).catch(() => {});
  }, []);
  return (
    <div>
      <div className="card">
        <h1>⛏ MineBeacon</h1>
        <p style={{ color: "var(--muted)" }}>Каталог Minecraft-серверов · Catalog · голосование · whitelist-заявки</p>
        <div className="row">
          <Link className="btn" href="/servers">{t.catalog}</Link>
          <Link className="btn btn-ghost" href="/servers/new">{t.add_server}</Link>
        </div>
      </div>
      <h2>{t.top_month}</h2>
      <div className="grid">{top.map(s => <ServerCard key={String(s.id)} s={s} />)}</div>
    </div>
  );
}
