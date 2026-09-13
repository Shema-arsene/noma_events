import type { OrderDTO } from "../../types";
import type { IOrder } from "./order.model";
import type { IEvent } from "../events/event.model";

type PopulatedOrder = Omit<IOrder, "eventId"> & {
  _id: IOrder["_id"];
  eventId: IEvent & { _id: IEvent["_id"] };
};

export function toOrderDTO(order: PopulatedOrder): OrderDTO {
  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    userId: order.userId.toString(),
    event: {
      id: order.eventId._id.toString(),
      title: order.eventId.title,
      slug: order.eventId.slug,
      coverImage: order.eventId.coverImage ?? undefined,
      startAt: order.eventId.startAt.toISOString(),
      city: order.eventId.city,
    },
    items: order.items.map((item) => ({
      ticketTypeId: item.ticketTypeId.toString(),
      ticketTypeName: item.ticketTypeName,
      quantity: item.quantity,
      unitPriceXaf: item.unitPriceXaf,
      totalXaf: item.totalXaf,
    })),
    subtotalXaf: order.subtotalXaf,
    feesXaf: order.feesXaf,
    totalXaf: order.totalXaf,
    currency: order.currency,
    status: order.status as OrderDTO["status"],
    expiresAt: order.expiresAt ? order.expiresAt.toISOString() : undefined,
    createdAt: (order as unknown as { createdAt: Date }).createdAt.toISOString(),
  };
}
