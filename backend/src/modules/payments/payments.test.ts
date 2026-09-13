import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Express } from "express";
import { setupTestDatabase } from "../../test/testApp";
import { createPublishedEvent, registerAgent } from "../../test/fixtures";
import { TicketModel } from "../tickets/ticket.model";
import { TicketTypeModel } from "../events/ticketType.model";

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET!;

describe("payments (mock provider)", () => {
  let app: Express;
  let teardown: () => Promise<void>;

  beforeAll(async () => {
    ({ app, teardown } = await setupTestDatabase());
  });

  afterAll(async () => {
    await teardown();
  });

  async function buyOrder(quantity = 2) {
    const organizer = await registerAgent(app);
    const { eventId, ticketTypeId } = await createPublishedEvent(app, organizer.agent, { ticketQuantity: 10 });
    const buyer = await registerAgent(app);
    const order = await buyer.agent.post("/api/v1/orders").send({
      eventId,
      items: [{ ticketTypeId, quantity }],
      attendee: { name: "Buyer", email: buyer.email },
    });
    return { buyer, orderId: order.body.data.id as string, ticketTypeId, quantity };
  }

  it("rejects a webhook with an invalid signature", async () => {
    const { buyer, orderId } = await buyOrder();
    const init = await buyer.agent.post("/api/v1/payments/mock/initialize").send({ orderId });
    expect(init.status).toBe(201);

    const res = await buyer.agent
      .post("/api/v1/payments/mock/webhook")
      .send({ reference: init.body.data.reference, outcome: "SUCCESS", amountXaf: 1, signature: "wrong-secret" });
    expect(res.status).toBe(400);
  });

  it("issues exactly one ticket per unit purchased, exactly once, even if the webhook fires twice", async () => {
    const { buyer, orderId, ticketTypeId, quantity } = await buyOrder(3);
    const init = await buyer.agent.post("/api/v1/payments/mock/initialize").send({ orderId });
    const reference = init.body.data.reference as string;

    const payload = { reference, outcome: "SUCCESS" as const, amountXaf: 15000, signature: WEBHOOK_SECRET };

    const first = await buyer.agent.post("/api/v1/payments/mock/webhook").send(payload);
    expect(first.status).toBe(200);
    const second = await buyer.agent.post("/api/v1/payments/mock/webhook").send(payload);
    expect(second.status).toBe(200);
    expect(second.body.data.alreadyProcessed).toBe(true);

    const tickets = await TicketModel.find({ orderId });
    expect(tickets.length).toBe(quantity);

    const ticketType = await TicketTypeModel.findById(ticketTypeId);
    expect(ticketType!.soldQuantity).toBe(quantity);
    expect(ticketType!.reservedQuantity).toBe(0);

    const myTickets = await buyer.agent.get("/api/v1/me/tickets");
    expect(myTickets.body.data.length).toBe(quantity);
  });

  it("marks the order FAILED and issues no tickets on a failed payment", async () => {
    const { buyer, orderId } = await buyOrder(1);
    const init = await buyer.agent.post("/api/v1/payments/mock/initialize").send({ orderId });
    const reference = init.body.data.reference as string;

    await buyer.agent
      .post("/api/v1/payments/mock/webhook")
      .send({ reference, outcome: "FAILED", amountXaf: 5000, signature: WEBHOOK_SECRET });

    const tickets = await TicketModel.find({ orderId });
    expect(tickets.length).toBe(0);

    const order = await buyer.agent.get(`/api/v1/orders/${orderId}`);
    expect(order.body.data.status).toBe("FAILED");
  });
});
