export const dynamic = "force-dynamic";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { getCurrentUser, checkCsrf } from "@/lib/session";
import { j, err } from "@/lib/api";
const ALLOWED: Record<string, string> = {
  "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/gif": ".gif"
};
export async function POST(req: Request) {
  if (!(await checkCsrf(req))) return err("csrf", 403);
  const u = await getCurrentUser();
  if (!u) return err("auth", 401);
  const form = await req.formData().catch(() => null);
  if (!form) return err("invalid_data", 400);
  const file = form.get("file") as File | null;
  const kind = String(form.get("kind") || "logo");
  if (!file || typeof file.arrayBuffer !== "function") return err("no_file", 400);
  const mime = file.type;
  if (!ALLOWED[mime]) return err("bad_type", 400);
  const buf = Buffer.from(await file.arrayBuffer());
  const max = kind === "banner" ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
  if (buf.length > max) return err("too_big", 400);
  const name = `${Date.now()}_${crypto.randomBytes(6).toString("hex")}${ALLOWED[mime]}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buf);
  return j({ ok: true, url: `/uploads/${name}` });
}
