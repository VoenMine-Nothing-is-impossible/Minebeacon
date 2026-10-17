import crypto from "crypto";
export interface TelegramData { [k: string]: string }
export function verifyTelegram(data: TelegramData, botToken: string): boolean {
  const hash = data.hash;
  if (!hash) return false;
  const authDate = Number(data.auth_date || "0");
  if (!authDate) return false;
  // срок 24 часа
  if (Date.now() / 1000 - authDate > 86400) return false;
  const pairs = Object.keys(data).filter(k => k !== "hash").sort().map(k => `${k}=${data[k]}`);
  const check = pairs.join("\n");
  const secret = crypto.createHash("sha256").update(botToken).digest();
  const hmac = crypto.createHmac("sha256", secret).update(check).digest("hex");
  return hmac === hash;
}
