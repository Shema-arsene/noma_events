import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { NotificationType } from "../../types";

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    readAt: { type: Date },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export type INotification = InferSchemaType<typeof notificationSchema> & { _id: Types.ObjectId };

export const NotificationModel = model<INotification>("Notification", notificationSchema);
