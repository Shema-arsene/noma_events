import type { AdminOverviewDTO } from "../../types";
import { EventStatus, OrderStatus, OrganizerVerificationStatus, UserStatus } from "../../types";
import type { SuspendUserInput } from "../../validation";
import { UserModel } from "../users/user.model";
import { OrganizerModel } from "../organizers/organizer.model";
import { EventModel } from "../events/event.model";
import { OrderModel } from "../orders/order.model";
import { AuditLogModel } from "../audit/auditLog.model";
import { NotFoundError } from "../../common/errors";

export async function getOverview(): Promise<AdminOverviewDTO> {
  const [totalUsers, totalOrganizers, pendingOrganizers, totalEvents, publishedEvents, totalOrders, paidOrdersAgg] =
    await Promise.all([
      UserModel.countDocuments(),
      OrganizerModel.countDocuments(),
      OrganizerModel.countDocuments({ verificationStatus: OrganizerVerificationStatus.PENDING }),
      EventModel.countDocuments(),
      EventModel.countDocuments({ status: EventStatus.PUBLISHED }),
      OrderModel.countDocuments(),
      OrderModel.aggregate([
        { $match: { status: OrderStatus.PAID } },
        { $group: { _id: null, count: { $sum: 1 }, gross: { $sum: "$totalXaf" } } },
      ]),
    ]);

  const paid = paidOrdersAgg[0] ?? { count: 0, gross: 0 };

  return {
    totalUsers,
    totalOrganizers,
    pendingOrganizers,
    totalEvents,
    publishedEvents,
    totalOrders,
    paidOrders: paid.count,
    grossSalesXaf: paid.gross,
  };
}

export async function listUsers(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    UserModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    UserModel.countDocuments(),
  ]);
  return { users, total };
}

export async function suspendUser(userId: string, actorId: string, input: SuspendUserInput) {
  const user = await UserModel.findById(userId);
  if (!user) throw new NotFoundError("Utilisateur introuvable");
  user.status = input.status as UserStatus;
  if (input.status === UserStatus.SUSPENDED) {
    user.tokenVersion += 1; // force logout everywhere
  }
  await user.save();

  await AuditLogModel.create({
    actorId,
    action: `USER_${input.status}`,
    entityType: "User",
    entityId: userId,
    metadata: { reason: input.reason },
  });

  return user;
}

export async function listOrganizers(status: OrganizerVerificationStatus | undefined, page: number, limit: number) {
  const filter = status ? { verificationStatus: status } : {};
  const skip = (page - 1) * limit;
  const [organizers, total] = await Promise.all([
    OrganizerModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    OrganizerModel.countDocuments(filter),
  ]);
  return { organizers, total };
}

export async function listEvents(status: EventStatus | undefined, page: number, limit: number) {
  const filter = status ? { status } : {};
  const skip = (page - 1) * limit;
  const [events, total] = await Promise.all([
    EventModel.find(filter)
      .populate([{ path: "organizerId", select: "name slug" }, { path: "categoryId", select: "name slug" }])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    EventModel.countDocuments(filter),
  ]);
  return { events, total };
}

export async function adminCancelEvent(eventId: string, actorId: string) {
  const event = await EventModel.findById(eventId);
  if (!event) throw new NotFoundError("Événement introuvable");
  event.status = EventStatus.CANCELLED;
  event.cancelledAt = new Date();
  await event.save();

  const { cancelTicketsForEvent } = await import("../tickets/tickets.service");
  const { cancelPendingOrdersForEvent } = await import("../orders/orders.service");
  await Promise.all([cancelTicketsForEvent(eventId), cancelPendingOrdersForEvent(eventId)]);

  await AuditLogModel.create({ actorId, action: "EVENT_CANCELLED_BY_ADMIN", entityType: "Event", entityId: eventId });
  return event;
}

export async function listOrders(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    OrderModel.find().populate("eventId", "title slug").sort({ createdAt: -1 }).skip(skip).limit(limit),
    OrderModel.countDocuments(),
  ]);
  return { orders, total };
}

export async function listAuditLogs(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AuditLogModel.find().populate("actorId", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLogModel.countDocuments(),
  ]);
  return { logs, total };
}
