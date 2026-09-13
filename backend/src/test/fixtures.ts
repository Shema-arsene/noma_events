import type { Express } from "express";
import request from "supertest";
import { CategoryModel } from "../modules/categories/category.model";

let emailCounter = 0;

export function uniqueEmail(prefix: string): string {
  emailCounter += 1;
  return `${prefix}${emailCounter}@example.com`;
}

type Method = "get" | "post" | "patch" | "delete";

/** Wraps supertest requests with an `Authorization: Bearer <token>` header, standing in for the browser's old cookie jar now that auth is a Bearer token instead of a cookie. */
export interface AuthedAgent {
  get(url: string): request.Test;
  post(url: string): request.Test;
  patch(url: string): request.Test;
  delete(url: string): request.Test;
  setToken(token: string): void;
}

function createAuthedAgent(app: Express, initialToken: string): AuthedAgent {
  let token = initialToken;
  const call = (method: Method) => (url: string) => request(app)[method](url).set("Authorization", `Bearer ${token}`);
  return {
    get: call("get"),
    post: call("post"),
    patch: call("patch"),
    delete: call("delete"),
    setToken: (t: string) => {
      token = t;
    },
  };
}

/** Registers a new user and returns a Bearer-token-authenticated agent plus the created user's id. */
export async function registerAgent(
  app: Express,
  overrides: Partial<{ name: string; email: string; password: string }> = {},
) {
  const email = overrides.email ?? uniqueEmail("user");
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({
      name: overrides.name ?? "Test User",
      email,
      password: overrides.password ?? "Password123!",
    });
  if (res.status !== 201) {
    throw new Error(`registerAgent failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  const agent = createAuthedAgent(app, res.body.data.accessToken as string);
  return { agent, userId: res.body.data.user.id as string, email };
}

export async function createCategory(name = "Musique") {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-");
  const existing = await CategoryModel.findOne({ slug });
  if (existing) return existing;
  return CategoryModel.create({ name, slug, active: true });
}

interface EventSetupOptions {
  ticketPriceXaf?: number;
  ticketQuantity?: number;
}

/** Creates an organizer profile + a fully valid, published event with one ticket type, owned by `agent`. */
export async function createPublishedEvent(app: Express, agent: AuthedAgent, options: EventSetupOptions = {}) {
  const category = await createCategory();

  // Reuse an existing organizer profile for this agent if one was already created
  // (a user may own only one organizer profile), otherwise create a fresh one.
  let organizerId: string;
  const existing = await agent.get("/api/v1/organizers/me");
  if (existing.status === 200) {
    organizerId = existing.body.data.id as string;
  } else {
    const orgRes = await agent.post("/api/v1/organizers").send({ name: `Organizer ${Date.now()}-${Math.random()}` });
    if (orgRes.status !== 201) throw new Error(`create organizer failed: ${JSON.stringify(orgRes.body)}`);
    organizerId = orgRes.body.data.id as string;
  }

  const now = new Date();
  const startAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const endAt = new Date(startAt.getTime() + 3 * 60 * 60 * 1000);

  const eventRes = await agent.post("/api/v1/organizers/events").send({
    title: "Concert de Test",
    summary: "Un super concert",
    description: "Description complète de l'événement de test.",
    categoryId: category._id.toString(),
    venue: { name: "Salle Test", address: "1 rue du Test", city: "Libreville", country: "Gabon" },
    coverImage: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3",
    city: "Libreville",
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    salesStartAt: now.toISOString(),
    salesEndAt: startAt.toISOString(),
    visibility: "PUBLIC",
    ticketTypes: [
      {
        name: "Standard",
        priceXaf: options.ticketPriceXaf ?? 5000,
        quantity: options.ticketQuantity ?? 10,
        salesStartAt: now.toISOString(),
        salesEndAt: startAt.toISOString(),
      },
    ],
  });
  if (eventRes.status !== 201) throw new Error(`create event failed: ${JSON.stringify(eventRes.body)}`);

  const eventId = eventRes.body.data.id as string;
  const ticketTypeId = eventRes.body.data.ticketTypes[0].id as string;

  const publishRes = await agent.post(`/api/v1/organizers/events/${eventId}/publish`);
  if (publishRes.status !== 200) throw new Error(`publish failed: ${JSON.stringify(publishRes.body)}`);

  return { organizerId, eventId, ticketTypeId, slug: eventRes.body.data.slug as string };
}
