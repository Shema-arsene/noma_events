import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Express } from "express";
import { setupTestDatabase } from "../../test/testApp";
import { createPublishedEvent, registerAgent } from "../../test/fixtures";
import { sweepExpiredOrders } from "./orders.service";
import { OrderModel } from "./order.model";
import { TicketTypeModel } from "../events/ticketType.model";

describe("orders / checkout", () => {
  let app: Express;
  let teardown: () => Promise<void>;

  beforeAll(async () => {
    ({ app, teardown } = await setupTestDatabase());
  });

  afterAll(async () => {
    await teardown();
  });

  it("ignores client-supplied price and computes totals from the server-side ticket type", async () => {
    const organizer = await registerAgent(app);
    const { eventId, ticketTypeId } = await createPublishedEvent(app, organizer.agent, { ticketPriceXaf: 5000 });

    const buyer = await registerAgent(app);
    const res = await buyer.agent.post("/api/v1/orders").send({
      eventId,
      items: [{ ticketTypeId, quantity: 2, unitPriceXaf: 1 }], // attempted price tampering; extra field ignored by schema
      attendee: { name: "Buyer", email: buyer.email },
    });

    expect(res.status).toBe(201);
    expect(res.body.data.items[0].unitPriceXaf).toBe(5000);
    expect(res.body.data.totalXaf).toBe(10000);
  });

  it("never oversells: concurrent orders cannot reserve more than available inventory", async () => {
    const organizer = await registerAgent(app);
    const { eventId, ticketTypeId } = await createPublishedEvent(app, organizer.agent, { ticketQuantity: 3 });

    const buyers = await Promise.all([registerAgent(app), registerAgent(app), registerAgent(app)]);

    const results = await Promise.all(
      buyers.map((b) =>
        b.agent.post("/api/v1/orders").send({
          eventId,
          items: [{ ticketTypeId, quantity: 2 }], // 3 buyers x 2 = 6 requested against 3 available
          attendee: { name: "Buyer", email: b.email },
        }),
      ),
    );

    const succeeded = results.filter((r) => r.status === 201);
    const failed = results.filter((r) => r.status !== 201);
    expect(succeeded.length).toBe(1);
    expect(failed.length).toBe(2);

    const ticketType = await TicketTypeModel.findById(ticketTypeId);
    expect(ticketType!.reservedQuantity).toBeLessThanOrEqual(ticketType!.quantity);
  });

  it("releases inventory when a pending order expires via the sweep", async () => {
    const organizer = await registerAgent(app);
    const { eventId, ticketTypeId } = await createPublishedEvent(app, organizer.agent, { ticketQuantity: 5 });

    const buyer = await registerAgent(app);
    const order = await buyer.agent.post("/api/v1/orders").send({
      eventId,
      items: [{ ticketTypeId, quantity: 5 }],
      attendee: { name: "Buyer", email: buyer.email },
    });
    expect(order.status).toBe(201);

    let ticketType = await TicketTypeModel.findById(ticketTypeId);
    expect(ticketType!.reservedQuantity).toBe(5);

    // Force the order into the past so the sweep treats it as expired.
    await OrderModel.findByIdAndUpdate(order.body.data.id, { expiresAt: new Date(Date.now() - 1000) });

    const expiredCount = await sweepExpiredOrders();
    expect(expiredCount).toBeGreaterThanOrEqual(1);

    ticketType = await TicketTypeModel.findById(ticketTypeId);
    expect(ticketType!.reservedQuantity).toBe(0);

    const refreshedOrder = await OrderModel.findById(order.body.data.id);
    expect(refreshedOrder!.status).toBe("EXPIRED");
  });
});
