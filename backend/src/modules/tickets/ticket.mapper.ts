import type { TicketDTO } from "../../types";
import type { ITicket } from "./ticket.model";
import type { IEvent } from "../events/event.model";

type PopulatedTicket = Omit<ITicket, "eventId"> & {
  _id: ITicket["_id"];
  eventId: IEvent & { _id: IEvent["_id"] };
};

export function toTicketDTO(ticket: PopulatedTicket, qrImageDataUrl?: string): TicketDTO {
  return {
    id: ticket._id.toString(),
    displayCode: ticket.displayCode,
    orderId: ticket.orderId.toString(),
    eventId: ticket.eventId._id.toString(),
    ticketTypeId: ticket.ticketTypeId.toString(),
    ticketTypeName: ticket.ticketTypeName,
    ownerUserId: ticket.ownerUserId.toString(),
    attendeeName: ticket.attendeeName,
    status: ticket.status as TicketDTO["status"],
    qrImage: qrImageDataUrl,
    issuedAt: (ticket.issuedAt ?? new Date()).toISOString(),
    usedAt: ticket.usedAt ? ticket.usedAt.toISOString() : undefined,
    event: {
      id: ticket.eventId._id.toString(),
      title: ticket.eventId.title,
      slug: ticket.eventId.slug,
      coverImage: ticket.eventId.coverImage ?? undefined,
      startAt: ticket.eventId.startAt.toISOString(),
      endAt: ticket.eventId.endAt.toISOString(),
      city: ticket.eventId.city,
    },
  };
}
