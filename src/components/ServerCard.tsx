"use client";
import Link from "next/link";
export function ServerCard({ s }: { s: Record<string, never> }) {
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <strong><Link href={`/servers/${s.id}`}>{String(s.name)}</Link></strong>
        {s.online ? <span className="badge badge-on">● online {Number(s.playersOnline)}/{Number(s.playersMax)}</span>
          : <span className="badge badge-off">○ offline</span>}
      </div>
      <p style={{ color: "var(--muted)" }}>{String(s.shortDesc || "")}</p>
      <div className="row">
        <span className="badge">{String(s.version || "—")}</span>
        <span className="badge">{String(s.edition)}</span>
        <span className="badge">{String(s.access)}</span>
        <span className="badge">★ {Number(s.votesMonth)} / {Number(s.votesTotal)}</span>
        {(s.verified as boolean) && <span className="badge">✓</span>}
        {(s.featured as boolean) && <span className="badge">★ featured</span>}
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <span className="badge">{String(s.host)}:{Number(s.port)}</span>
      </div>
    </div>
  );
}
