let csrf = "";
export async function ensureCsrf(): Promise<string> {
  if (csrf) return csrf;
  try {
    const r = await fetch("/api/auth/csrf", { cache: "no-store" });
    const d = await r.json();
    csrf = d.csrf || "";
  } catch {}
  return csrf;
}
export async function api(path: string, opts: RequestInit = {}) {
  const method = (opts.method || "GET").toUpperCase();
  const headers: Record<string, string> = { ...(opts.headers as Record<string, string> || {}) };
  let body = opts.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(body);
  }
  if (!["GET", "HEAD"].includes(method)) {
    const t = await ensureCsrf();
    if (t) headers["x-csrf-token"] = t;
  }
  const r = await fetch(path, { ...opts, headers, body: body as BodyInit });
  let data: unknown = null;
  try { data = await r.json(); } catch {}
  return { ok: r.ok, status: r.status, data: data as Record<string, never> };
}
