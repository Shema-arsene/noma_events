import { nanoid } from "nanoid";
import { TicketStatus, NotificationType, UserRole } from "../../types";
import { TicketModel } from "./ticket.model";
import { TicketTypeModel } from "../events/ticketType.model";
import { OrderModel, type IOrder } from "../orders/order.model";
import { EventModel } from "../events/event.model";
import type { UserDocument } from "../users/user.model";
import { randomToken, hashToken } from "../../common/crypto";
import { NotFoundError } from "../../common/errors";
import { notify } from "../notifications/notifications.service";
import { assertOrganizerOwnership } from "../events/events.service";

function generateDisplayCode(): string {
  return `NM-${nanoid(8).toUpperCase()}`;
}

/**
 * Issues one Ticket document per unit purchased in a paid order, moves the
 * corresponding TicketType inventory from reserved to sold, and marks the
 * order as having issued tickets. Idempotent: safe to call more than once
 * for the same order (e.g. duplicate webhook delivery).
 */
export async function issueTicketsForOrder(order: IOrder): Promise<void> {
  const claimed = await OrderModel.findOneAndUpdate(
    { _id: order._id, ticketsIssuedAt: null },
    { ticketsIssuedAt: new Date() },
  );
  if (!claimed) return; // already issued by a concurrent/duplicate call

  const ticketsToCreate = order.items.flatMap((item) =>
    Array.from({ length: item.quantity }, () => {
      const qrSecret = randomToken();
      return {
        orderId: order._id,
        eventId: order.eventId,
        ticketTypeId: item.ticketTypeId,
        ticketTypeName: item.ticketTypeName,
        ownerUserId: order.userId,
        attendeeName: order.attendee!.name,
        qrSecret,
        ticketCodeHash: hashToken(qrSecret),
        displayCode: generateDisplayCode(),
        status: TicketStatus.ACTIVE,
        issuedAt: new Date(),
      };
    }),
  );

  await TicketModel.insertMany(ticketsToCreate);

  await Promise.all(
    order.items.map((item) =>
      TicketTypeModel.findByIdAndUpdate(item.ticketTypeId, {
        $inc: { soldQuantity: item.quantity, reservedQuantity: -item.quantity },
      }),
    ),
  );

  await notify({
    userId: order.userId,
    type: NotificationType.TICKET_READY,
    title: "Vos billets sont prêts",
    body: `Vos ${ticketsToCreate.length} billet(s) pour la commande ${order.orderNumber} sont disponibles dans votre compte.`,
  });
}

export async function cancelTicketsForEvent(eventId: string): Promise<void> {
  const tickets = await TicketModel.find({ eventId, status: TicketStatus.ACTIVE });
  if (tickets.length === 0) return;

  await TicketModel.updateMany(
    { eventId, status: TicketStatus.ACTIVE },
    { status: TicketStatus.CANCELLED },
  );

  const notifiedOwners = new Set<string>();
  for (const ticket of tickets) {
    const ownerId = ticket.ownerUserId.toString();
    if (notifiedOwners.has(ownerId)) continue;
    notifiedOwners.add(ownerId);
    await notify({
      userId: ticket.ownerUserId,
      type: NotificationType.EVENT_CANCELLED,
      title: "Événement annulé",
      body: "Un événement pour lequel vous avez un billet a été annulé. Votre billet est désormais invalide.",
    });
  }
}

export async function listMyTickets(userId: string) {
  return TicketModel.find({ ownerUserId: userId }).populate("eventId").sort({ createdAt: -1 });
}

export async function getTicketForOwner(ticketId: string, requester: UserDocument) {
  const ticket = await TicketModel.findById(ticketId).select("+qrSecret").populate("eventId");
  if (!ticket) throw new NotFoundError("Billet introuvable");

  const isOwner = ticket.ownerUserId.toString() === requester._id.toString();
  const isAdmin = requester.role === UserRole.ADMIN || requester.role === UserRole.SUPER_ADMIN;
  if (!isOwner && !isAdmin) {
    const event = await EventModel.findById(ticket.eventId);
    if (!event) throw new NotFoundError("Billet introuvable");
    await assertOrganizerOwnership(event.organizerId.toString(), requester);
  }

  return ticket;
}

export async function listEventAttendees(eventId: string, requester: UserDocument) {
  const event = await EventModel.findById(eventId);
  if (!event) throw new NotFoundError("Événement introuvable");
  await assertOrganizerOwnership(event.organizerId.toString(), requester);

  return TicketModel.find({ eventId }).sort({ createdAt: -1 });
}
