import { prisma } from "./prisma";
import { decryptSecret, encryptSecret } from "./crypto-settings";

// Ключи настроек и признак секретности
export const SECRET_KEYS = new Set([
  "google_client_secret", "github_client_secret", "telegram_bot_token", "smtp_pass"
]);

export const DEFAULTS: Record<string, string> = {
  site_name: "MineBeacon",
  site_desc: "Каталог Minecraft-серверов",
  contact_email: "",
  registration_enabled: "1",
  google_enabled: "0", google_client_id: "", google_client_secret: "",
  github_enabled: "0", github_client_id: "", github_client_secret: "",
  telegram_enabled: "0", telegram_bot_name: "", telegram_bot_token: "",
  smtp_host: "", smtp_port: "587", smtp_enc: "starttls", smtp_user: "", smtp_pass: "",
  smtp_from: "", smtp_from_name: "MineBeacon",
  notify_new_app: "1", notify_status_change: "1",
  tpl_new_app_subject: "Новая заявка на {server_name}",
  tpl_new_app_body: "Новая заявка от {player_nick} на сервер {server_name}. Контакт: {contact}",
  tpl_status_subject: "Статус заявки: {status}",
  tpl_status_body: "Ваша заявка на сервер {server_name} ({player_nick}): {status}. Комментарий: {comment}",
  vote_interval_h: "24",
  turnstile_site_key: "", turnstile_secret_key: "", captcha_enabled: "0",
  vote_limit_per_ip_day: "20"
};

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key } });
  if (!row) return DEFAULTS[key] ?? "";
  if (row.secret) return decryptSecret(row.valueEnc);
  try {
    const o = JSON.parse(row.valueEnc);
    return typeof o.v === "string" ? o.v : "";
  } catch { return row.valueEnc; }
}
export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const k of keys) out[k] = await getSetting(k);
  return out;
}
export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  const map = new Map(rows.map(r => [r.key, r]));
  const out: Record<string, string> = {};
  for (const k of Object.keys(DEFAULTS)) {
    const row = map.get(k);
    if (!row) { out[k] = DEFAULTS[k]; continue; }
    if (row.secret) out[k] = decryptSecret(row.valueEnc);
    else {
      try { out[k] = (JSON.parse(row.valueEnc) as { v: string }).v; }
      catch { out[k] = row.valueEnc; }
    }
  }
  // подхватить smtp из env если в БД пусто
  if (!out.smtp_host && process.env.SMTP_HOST) {
    out.smtp_host = process.env.SMTP_HOST;
    out.smtp_port = process.env.SMTP_PORT || "587";
    out.smtp_user = process.env.SMTP_USER || "";
    out.smtp_pass = process.env.SMTP_PASS || "";
    out.smtp_from = process.env.SMTP_FROM || "";
  }
  return out;
}
export async function setSetting(key: string, value: string): Promise<void> {
  const secret = SECRET_KEYS.has(key);
  // пустое поле не затирает секрет
  if (secret && !value) return;
  const stored = secret ? encryptSecret(value) : JSON.stringify({ v: value });
  await prisma.setting.upsert({
    where: { key }, create: { key, valueEnc: stored, secret }, update: { valueEnc: stored, secret }
  });
}
export async function getPublicSettings() {
  const s = await getAllSettings();
  return {
    site_name: s.site_name, site_desc: s.site_desc,
    google_enabled: s.google_enabled === "1",
    github_enabled: s.github_enabled === "1",
    telegram_enabled: s.telegram_enabled === "1",
    telegram_bot_name: s.telegram_bot_name,
    captcha_enabled: s.captcha_enabled === "1",
    turnstile_site_key: s.turnstile_site_key,
    registration_enabled: s.registration_enabled === "1",
    vote_interval_h: Number(s.vote_interval_h || "24")
  };
}
