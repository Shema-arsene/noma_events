import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Express } from "express";
import { setupTestDatabase } from "../../test/testApp";
import { createPublishedEvent, registerAgent } from "../../test/fixtures";
import { TicketModel } from "../tickets/ticket.model";
import { buildQrPayload } from "../tickets/qr.service";

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET!;

describe("check-in / scanning", () => {
  let app: Express;
  let teardown: () => Promise<void>;

  beforeAll(async () => {
    ({ app, teardown } = await setupTestDatabase());
  });

  afterAll(async () => {
    await teardown();
  });

  async function buyAndIssueTicket() {
    const organizer = await registerAgent(app);
    const { eventId, ticketTypeId } = await createPublishedEvent(app, organizer.agent, { ticketQuantity: 5 });
    const buyer = await registerAgent(app);

    const order = await buyer.agent.post("/api/v1/orders").send({
      eventId,
      items: [{ ticketTypeId, quantity: 1 }],
      attendee: { name: "Buyer", email: buyer.email },
    });
    const init = await buyer.agent.post("/api/v1/payments/mock/initialize").send({ orderId: order.body.data.id });
    await buyer.agent.post("/api/v1/payments/mock/webhook").send({
      reference: init.body.data.reference,
      outcome: "SUCCESS",
      amountXaf: order.body.data.totalXaf,
      signature: WEBHOOK_SECRET,
    });

    const ticketDoc = await TicketModel.findOne({ orderId: order.body.data.id }).select("+qrSecret");
    const qrToken = buildQrPayload(ticketDoc!._id.toString(), ticketDoc!.qrSecret);

    return { organizer, eventId, qrToken, ticketId: ticketDoc!._id.toString() };
  }

  it("validates a fresh ticket once, then rejects the second scan as ALREADY_USED", async () => {
    const { organizer, eventId, qrToken } = await buyAndIssueTicket();

    const first = await organizer.agent.post("/api/v1/checkins/scan").send({ eventId, qrToken });
    expect(first.status).toBe(200);
    expect(first.body.data.result).toBe("VALID");

    const second = await organizer.agent.post("/api/v1/checkins/scan").send({ eventId, qrToken });
    expect(second.status).toBe(200);
    expect(second.body.data.result).toBe("ALREADY_USED");
  });

  it("returns WRONG_EVENT when the ticket belongs to a different event", async () => {
    const { organizer, qrToken } = await buyAndIssueTicket();
    const { eventId: otherEventId } = await createPublishedEvent(app, organizer.agent, { ticketQuantity: 1 });

    const res = await organizer.agent.post("/api/v1/checkins/scan").send({ eventId: otherEventId, qrToken });
    expect(res.status).toBe(200);
    expect(res.body.data.result).toBe("WRONG_EVENT");
  });

  it("returns INVALID for a malformed QR payload", async () => {
    const { organizer, eventId } = await buyAndIssueTicket();
    const res = await organizer.agent.post("/api/v1/checkins/scan").send({ eventId, qrToken: "not-a-real-payload" });
    expect(res.status).toBe(200);
    expect(res.body.data.result).toBe("INVALID");
  });

  it("returns INVALID (not a 500/400) when the QR payload's ticket segment isn't a valid id", async () => {
    const { organizer, eventId } = await buyAndIssueTicket();
    const res = await organizer.agent
      .post("/api/v1/checkins/scan")
      .send({ eventId, qrToken: "NOMA1.not-an-object-id.sometoken" });
    expect(res.status).toBe(200);
    expect(res.body.data.result).toBe("INVALID");
  });

  it("blocks a staff member who is not assigned to the event", async () => {
    const { eventId, qrToken } = await buyAndIssueTicket();
    const outsider = await registerAgent(app);

    const res = await outsider.agent.post("/api/v1/checkins/scan").send({ eventId, qrToken });
    expect(res.status).toBe(403);
  });

  it("allows an assigned EVENT_STAFF user (not the organizer) to scan", async () => {
    const { organizer, eventId, qrToken } = await buyAndIssueTicket();
    const staff = await registerAgent(app);

    const assign = await organizer.agent.post(`/api/v1/organizers/events/${eventId}/staff`).send({ email: staff.email });
    expect(assign.status).toBe(201);

    const res = await staff.agent.post("/api/v1/checkins/scan").send({ eventId, qrToken });
    expect(res.status).toBe(200);
    expect(res.body.data.result).toBe("VALID");
  });
});
