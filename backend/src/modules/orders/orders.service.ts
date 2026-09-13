import { nanoid } from "nanoid";
import type { HydratedDocument } from "mongoose";
import type { CreateOrderInput } from "../../validation";
import { EventStatus, OrderStatus } from "../../types";
import { OrderModel, type IOrder } from "./order.model";
import { TicketTypeModel } from "../events/ticketType.model";
import { EventModel } from "../events/event.model";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../../common/errors";
import { UserRole } from "../../types";
import type { UserDocument } from "../users/user.model";

const ORDER_EXPIRY_MINUTES = 15;

function generateOrderNumber(): string {
  return `ORD-${nanoid(8).toUpperCase()}`;
}

/**
 * Atomically reserves inventory for one ticket type: succeeds only if enough
 * unreserved/unsold stock remains, sales window is open and the type is active.
 * Never trusts client-supplied prices — unit price always comes from this read.
 */
async function reserveTicketType(eventId: string, ticketTypeId: string, quantity: number, now: Date) {
  const updated = await TicketTypeModel.findOneAndUpdate(
    {
      _id: ticketTypeId,
      eventId,
      active: true,
      salesStartAt: { $lte: now },
      salesEndAt: { $gte: now },
      $expr: {
        $gte: [{ $subtract: ["$quantity", { $add: ["$soldQuantity", "$reservedQuantity"] }] }, quantity],
      },
    },
    { $inc: { reservedQuantity: quantity } },
    { returnDocument: "after" },
  );
  return updated;
}

async function releaseReservation(ticketTypeId: string, quantity: number) {
  await TicketTypeModel.findByIdAndUpdate(ticketTypeId, { $inc: { reservedQuantity: -quantity } });
}

export async function createOrder(userId: string, input: CreateOrderInput): Promise<HydratedDocument<IOrder>> {
  const event = await EventModel.findById(input.eventId);
  if (!event) throw new NotFoundError("Événement introuvable");
  if (event.status !== EventStatus.PUBLISHED) {
    throw new BadRequestError("Cet événement n'accepte pas de nouvelles réservations");
  }

  const now = new Date();
  const reserved: Array<{ ticketTypeId: string; quantity: number }> = [];

  try {
    const items = [];
    for (const requested of input.items) {
      const ticketType = await reserveTicketType(
        input.eventId,
        requested.ticketTypeId,
        requested.quantity,
        now,
      );
      if (!ticketType) {
        throw new ConflictError(
          "Certains billets ne sont plus disponibles dans la quantité demandée. Veuillez actualiser la page.",
        );
      }
      reserved.push({ ticketTypeId: requested.ticketTypeId, quantity: requested.quantity });

      items.push({
        ticketTypeId: ticketType._id,
        ticketTypeName: ticketType.name,
        quantity: requested.quantity,
        unitPriceXaf: ticketType.priceXaf,
        totalXaf: ticketType.priceXaf * requested.quantity,
      });
    }

    const subtotalXaf = items.reduce((sum, item) => sum + item.totalXaf, 0);
    const feesXaf = 0;
    const totalXaf = subtotalXaf + feesXaf;

    const order = await OrderModel.create({
      orderNumber: generateOrderNumber(),
      userId,
      eventId: event._id,
      items,
      attendee: input.attendee,
      subtotalXaf,
      feesXaf,
      totalXaf,
      status: OrderStatus.PENDING,
      expiresAt: new Date(now.getTime() + ORDER_EXPIRY_MINUTES * 60 * 1000),
    });

    return order;
  } catch (err) {
    // Roll back any reservations made before the failure so inventory isn't stuck.
    await Promise.all(reserved.map((r) => releaseReservation(r.ticketTypeId, r.quantity)));
    throw err;
  }
}

export async function getOrderForOwner(orderId: string, requester: UserDocument) {
  const order = await OrderModel.findById(orderId).populate("eventId");
  if (!order) throw new NotFoundError("Commande introuvable");
  const isOwner = order.userId.toString() === requester._id.toString();
  const isAdmin = requester.role === UserRole.ADMIN || requester.role === UserRole.SUPER_ADMIN;
  if (!isOwner && !isAdmin) throw new ForbiddenError("Vous n'avez pas accès à cette commande");
  return order;
}

export async function listMyOrders(userId: string) {
  return OrderModel.find({ userId }).populate("eventId").sort({ createdAt: -1 });
}

/** Releases expired PENDING orders' reserved inventory. Called by the periodic sweep. */
export async function sweepExpiredOrders(): Promise<number> {
  const now = new Date();
  const expired = await OrderModel.find({ status: OrderStatus.PENDING, expiresAt: { $lt: now } });
  for (const order of expired) {
    await Promise.all(order.items.map((item) => releaseReservation(item.ticketTypeId.toString(), item.quantity)));
    order.status = OrderStatus.EXPIRED;
    await order.save();
  }
  return expired.length;
}

export async function cancelPendingOrdersForEvent(eventId: string): Promise<void> {
  const pending = await OrderModel.find({ eventId, status: OrderStatus.PENDING });
  for (const order of pending) {
    await Promise.all(order.items.map((item) => releaseReservation(item.ticketTypeId.toString(), item.quantity)));
    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    await order.save();
  }
}
