export const dynamic = "force-dynamic";
import { j } from "@/lib/api";
import { getPublicSettings } from "@/lib/settings";
export async function GET() {
  return j(await getPublicSettings());
}
