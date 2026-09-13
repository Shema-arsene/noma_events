import type { TicketTypeDTO } from "../../types";
import type { HydratedDocument } from "mongoose";
import type { ITicketType } from "./ticketType.model";

export function toTicketTypeDTO(ticketType: HydratedDocument<ITicketType>): TicketTypeDTO {
  return {
    id: ticketType._id.toString(),
    eventId: ticketType.eventId.toString(),
    name: ticketType.name,
    description: ticketType.description ?? undefined,
    priceXaf: ticketType.priceXaf,
    quantity: ticketType.quantity,
    soldQuantity: ticketType.soldQuantity,
    remaining: Math.max(0, ticketType.quantity - ticketType.soldQuantity - ticketType.reservedQuantity),
    salesStartAt: ticketType.salesStartAt.toISOString(),
    salesEndAt: ticketType.salesEndAt.toISOString(),
    active: ticketType.active,
  };
}
