import { Schema, model, Types, type InferSchemaType } from "mongoose";

const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

auditLogSchema.index({ createdAt: -1 });

export type IAuditLog = InferSchemaType<typeof auditLogSchema> & { _id: Types.ObjectId };

export const AuditLogModel = model<IAuditLog>("AuditLog", auditLogSchema);
