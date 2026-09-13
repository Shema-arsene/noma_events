import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Express } from "express";
import request from "supertest";
import { setupTestDatabase } from "../../test/testApp";
import { createCategory, createPublishedEvent, registerAgent } from "../../test/fixtures";

describe("events", () => {
  let app: Express;
  let teardown: () => Promise<void>;

  beforeAll(async () => {
    ({ app, teardown } = await setupTestDatabase());
  });

  afterAll(async () => {
    await teardown();
  });

  it("lets an organizer create, then publish, an event", async () => {
    const { agent } = await registerAgent(app);
    const { eventId } = await createPublishedEvent(app, agent);

    const res = await agent.get(`/api/v1/organizers/events/${eventId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("PUBLISHED");
  });

  it("refuses to publish an event with no ticket types", async () => {
    const { agent } = await registerAgent(app);
    const category = await createCategory();
    await agent.post("/api/v1/organizers").send({ name: `NoTix ${Date.now()}` });

    const now = new Date();
    const startAt = new Date(now.getTime() + 86400000);
    const create = await agent.post("/api/v1/organizers/events").send({
      title: "Sans billets",
      summary: "résumé",
      description: "description complète de test",
      categoryId: category._id.toString(),
      venue: { name: "Lieu", address: "Adresse", city: "Libreville", country: "Gabon" },
      coverImage: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3",
      city: "Libreville",
      startAt: startAt.toISOString(),
      endAt: new Date(startAt.getTime() + 3600000).toISOString(),
      salesStartAt: now.toISOString(),
      salesEndAt: startAt.toISOString(),
      ticketTypes: [{ name: "x", priceXaf: 0, quantity: 1, salesStartAt: now.toISOString(), salesEndAt: startAt.toISOString() }],
    });
    expect(create.status).toBe(201);
    const eventId = create.body.data.id as string;

    // Remove the only ticket type directly, then attempt publish.
    const ticketTypeId = create.body.data.ticketTypes[0].id as string;
    const del = await agent.delete(`/api/v1/organizers/events/${eventId}/ticket-types/${ticketTypeId}`);
    expect(del.status).toBe(200);

    const publish = await agent.post(`/api/v1/organizers/events/${eventId}/publish`);
    expect(publish.status).toBe(400);
  });

  it("prevents one organizer from editing another organizer's event", async () => {
    const owner = await registerAgent(app);
    const { eventId } = await createPublishedEvent(app, owner.agent);

    const intruder = await registerAgent(app);
    await intruder.agent.post("/api/v1/organizers").send({ name: `Intruder ${Date.now()}` });

    const res = await intruder.agent.patch(`/api/v1/organizers/events/${eventId}`).send({ title: "Hacked" });
    expect(res.status).toBe(403);
  });

  it("only exposes published events in public search", async () => {
    const { agent } = await registerAgent(app);
    const { eventId, slug } = await createPublishedEvent(app, agent);

    const publicList = await request(app).get("/api/v1/events");
    expect(publicList.status).toBe(200);
    expect(publicList.body.data.some((e: { id: string }) => e.id === eventId)).toBe(true);

    const detail = await request(app).get(`/api/v1/events/${slug}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.ticketTypes.length).toBe(1);
  });

  it("rejects checkout against a cancelled event", async () => {
    const { agent } = await registerAgent(app);
    const { eventId, ticketTypeId } = await createPublishedEvent(app, agent);

    const cancel = await agent.post(`/api/v1/organizers/events/${eventId}/cancel`);
    expect(cancel.status).toBe(200);

    const buyer = await registerAgent(app);
    const order = await buyer.agent.post("/api/v1/orders").send({
      eventId,
      items: [{ ticketTypeId, quantity: 1 }],
      attendee: { name: "Buyer", email: buyer.email },
    });
    expect(order.status).toBe(400);
  });
});
