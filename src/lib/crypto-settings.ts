import crypto from "crypto";
const KEY_RAW = process.env.SETTINGS_ENCRYPTION_KEY || "";
function getKey(): Buffer {
  // допускаем hex 64 символа (32 байта), base64 или произвольную фразу
  const s = KEY_RAW.trim();
  if (/^[0-9a-fA-F]{64}$/.test(s)) return Buffer.from(s, "hex");
  try {
    const b = Buffer.from(s, "base64");
    if (b.length === 32) return b;
  } catch {}
  // fallback: sha256 от строки
  return crypto.createHash("sha256").update(s || "minebeacon-fallback-key").digest();
}
export function encryptSecret(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({ iv: iv.toString("hex"), tag: tag.toString("hex"), data: enc.toString("hex") });
}
export function decryptSecret(payload: string): string {
  try {
    const o = JSON.parse(payload);
    if (!o.iv || !o.tag || !o.data) return "";
    const key = getKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(o.iv, "hex"));
    decipher.setAuthTag(Buffer.from(o.tag, "hex"));
    const dec = Buffer.concat([decipher.update(Buffer.from(o.data, "hex")), decipher.final()]);
    return dec.toString("utf8");
  } catch {
    return "";
  }
}
export function maskSecret(v: string): string {
  if (!v) return "";
  if (v.length <= 4) return "****";
  return "****" + v.slice(-4);
}
