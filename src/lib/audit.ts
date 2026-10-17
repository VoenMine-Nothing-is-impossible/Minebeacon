import { prisma } from "./prisma";
export async function audit(actorId: string | null, action: string, entity = "", entityId = "", meta: unknown = null, ip = "") {
  try {
    await prisma.auditLog.create({ data: { actorId, action, entity, entityId, meta: (meta as object) ?? {}, ip } });
  } catch {}
}
