export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { j, err, ipOf } from "@/lib/api";
import { getCurrentUser, checkCsrf, appUrl } from "@/lib/session";
import { getAllSettings, setSetting, SECRET_KEYS } from "@/lib/settings";
import { maskSecret } from "@/lib/crypto-settings";
import { audit } from "@/lib/audit";

export async function GET() {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return err("forbidden", 403);
  const s = await getAllSettings();
  const masked: Record<string, string> = { ...s };
  for (const k of SECRET_KEYS) if (masked[k]) masked[k] = maskSecret(masked[k]);
  return j({ settings: masked, callbackUrls: {
    google: `${appUrl()}/api/auth/callback/google`,
    github: `${appUrl()}/api/auth/callback/github`,
    telegram_note: "Telegram Login Widget: укажите домен из APP_URL в BotFather /setdomain"
  }});
}
export async function PUT(req: Request) {
  if (!(await checkCsrf(req))) return err("csrf", 403);
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") return err("forbidden", 403);
  const body = await req.json().catch(() => ({}));
  const allowed = [
    "site_name","site_desc","contact_email","registration_enabled",
    "google_enabled","google_client_id","google_client_secret",
    "github_enabled","github_client_id","github_client_secret",
    "telegram_enabled","telegram_bot_name","telegram_bot_token",
    "smtp_host","smtp_port","smtp_enc","smtp_user","smtp_pass","smtp_from","smtp_from_name",
    "notify_new_app","notify_status_change","tpl_new_app_subject","tpl_new_app_body","tpl_status_subject","tpl_status_body",
    "vote_interval_h","turnstile_site_key","turnstile_secret_key","captcha_enabled","vote_limit_per_ip_day"
  ];
  for (const k of allowed) {
    if (k in body) await setSetting(k, String(body[k] ?? ""));
  }
  await audit(u.id, "settings_update", "settings", "", {}, ipOf(req));
  return j({ ok: true });
}
