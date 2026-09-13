import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Express } from "express";
import request from "supertest";
import { setupTestDatabase } from "../../test/testApp";
import { uniqueEmail } from "../../test/fixtures";

describe("auth", () => {
  let app: Express;
  let teardown: () => Promise<void>;

  beforeAll(async () => {
    ({ app, teardown } = await setupTestDatabase());
  });

  afterAll(async () => {
    await teardown();
  });

  it("registers a new user and returns access/refresh tokens", async () => {
    const email = uniqueEmail("register");
    const res = await request(app).post("/api/v1/auth/register").send({
      name: "Alice Test",
      email,
      password: "Password123!",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user.role).toBe("ATTENDEE");
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
    expect(typeof res.body.data.accessToken).toBe("string");
    expect(typeof res.body.data.refreshToken).toBe("string");
  });

  it("rejects duplicate registration", async () => {
    const email = uniqueEmail("dup");
    await request(app).post("/api/v1/auth/register").send({ name: "Bob", email, password: "Password123!" });
    const res = await request(app).post("/api/v1/auth/register").send({ name: "Bob2", email, password: "Password123!" });
    expect(res.status).toBe(409);
  });

  it("logs in with correct credentials and rejects wrong password", async () => {
    const email = uniqueEmail("login");
    await request(app).post("/api/v1/auth/register").send({ name: "Carol", email, password: "Password123!" });

    const good = await request(app).post("/api/v1/auth/login").send({ email, password: "Password123!" });
    expect(good.status).toBe(200);
    expect(typeof good.body.data.accessToken).toBe("string");

    const bad = await request(app).post("/api/v1/auth/login").send({ email, password: "WrongPassword!" });
    expect(bad.status).toBe(401);
  });

  it("returns the current user from /me with a valid Bearer token, 401 without one", async () => {
    const email = uniqueEmail("me");
    const register = await request(app).post("/api/v1/auth/register").send({ name: "Dave", email, password: "Password123!" });
    const { accessToken } = register.body.data;

    const authed = await request(app).get("/api/v1/me").set("Authorization", `Bearer ${accessToken}`);
    expect(authed.status).toBe(200);
    expect(authed.body.data.user.email).toBe(email);

    const anon = await request(app).get("/api/v1/me");
    expect(anon.status).toBe(401);
  });

  it("rejects /me with a malformed or missing Bearer token", async () => {
    const noHeader = await request(app).get("/api/v1/me");
    expect(noHeader.status).toBe(401);

    const badToken = await request(app).get("/api/v1/me").set("Authorization", "Bearer not-a-real-token");
    expect(badToken.status).toBe(401);
  });

  it("issues a new access token from a valid refresh token", async () => {
    const email = uniqueEmail("refresh");
    const register = await request(app).post("/api/v1/auth/register").send({ name: "Frank", email, password: "Password123!" });
    const { refreshToken } = register.body.data;

    const refreshed = await request(app).post("/api/v1/auth/refresh").send({ refreshToken });
    expect(refreshed.status).toBe(200);
    expect(typeof refreshed.body.data.accessToken).toBe("string");

    const me = await request(app).get("/api/v1/me").set("Authorization", `Bearer ${refreshed.body.data.accessToken}`);
    expect(me.status).toBe(200);
  });

  it("logout succeeds; the client is responsible for discarding its tokens afterward", async () => {
    const email = uniqueEmail("logout");
    const register = await request(app).post("/api/v1/auth/register").send({ name: "Eve", email, password: "Password123!" });
    const { accessToken } = register.body.data;

    const logout = await request(app).post("/api/v1/auth/logout").set("Authorization", `Bearer ${accessToken}`);
    expect(logout.status).toBe(200);
  });
});
