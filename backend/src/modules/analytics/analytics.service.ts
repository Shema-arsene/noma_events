import type { OrganizerAnalyticsDTO } from "../../types";
import { OrderStatus, TicketStatus } from "../../types";
import { EventModel } from "../events/event.model";
import { OrderModel } from "../orders/order.model";
import { TicketModel } from "../tickets/ticket.model";
import { assertOrganizerOwnership } from "../events/events.service";
import type { UserDocument } from "../users/user.model";
import { NotFoundError } from "../../common/errors";

export async function getEventAnalytics(eventId: string, requester: UserDocument): Promise<OrganizerAnalyticsDTO> {
  const event = await EventModel.findById(eventId);
  if (!event) throw new NotFoundError("Événement introuvable");
  await assertOrganizerOwnership(event.organizerId.toString(), requester);

  const [ticketsSold, attendance, orderAgg, salesByTicketType] = await Promise.all([
    TicketModel.countDocuments({ eventId, status: { $in: [TicketStatus.ACTIVE, TicketStatus.USED] } }),
    TicketModel.countDocuments({ eventId, status: TicketStatus.USED }),
    OrderModel.aggregate([
      { $match: { eventId: event._id, status: OrderStatus.PAID } },
      { $group: { _id: null, grossSalesXaf: { $sum: "$totalXaf" }, paidOrders: { $sum: 1 } } },
    ]),
    OrderModel.aggregate([
      { $match: { eventId: event._id, status: OrderStatus.PAID } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.ticketTypeId",
          name: { $first: "$items.ticketTypeName" },
          sold: { $sum: "$items.quantity" },
          grossXaf: { $sum: "$items.totalXaf" },
        },
      },
      { $sort: { grossXaf: -1 } },
    ]),
  ]);

  const totals = orderAgg[0] ?? { grossSalesXaf: 0, paidOrders: 0 };

  return {
    ticketsSold,
    grossSalesXaf: totals.grossSalesXaf,
    paidOrders: totals.paidOrders,
    attendance,
    checkInRate: ticketsSold > 0 ? Number((attendance / ticketsSold).toFixed(4)) : 0,
    salesByTicketType: salesByTicketType.map((row) => ({
      ticketTypeId: row._id.toString(),
      name: row.name,
      sold: row.sold,
      grossXaf: row.grossXaf,
    })),
  };
}
