import type { Types } from "mongoose";
import { NotificationType } from "../../types";
import { logger } from "../../config/logger";
import { NotificationModel } from "./notification.model";

interface NotifyInput {
  userId: Types.ObjectId | string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

/**
 * Development notification "provider": persists an in-app notification and logs
 * it as if it were an outbound email/SMS. Swap for a real EMAIL_PROVIDER adapter
 * (e.g. SMTP/SendGrid) without changing any caller.
 */
export async function notify(input: NotifyInput): Promise<void> {
  const notification = await NotificationModel.create({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    metadata: input.metadata,
  });

  logger.info(
    { notificationId: notification._id.toString(), userId: input.userId.toString(), type: input.type },
    `[dev-notification] ${input.title} — ${input.body}`,
  );
}
