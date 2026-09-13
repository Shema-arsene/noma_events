import type { Types } from "mongoose";
import { AuditLogModel } from "./auditLog.model";

export async function recordAudit(
  actorId: Types.ObjectId | string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await AuditLogModel.create({ actorId, action, entityType, entityId, metadata });
}
