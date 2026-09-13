import path from "node:path";
import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";

import { env } from "./config/env";
import { logger } from "./config/logger";
import { requestId } from "./middleware/requestId";
import { globalRateLimiter } from "./middleware/rateLimit";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";
import { sendSuccess } from "./common/response";

import authRoutes from "./modules/auth/auth.routes";
import meRoutes from "./modules/users/me.routes";
import organizersRoutes from "./modules/organizers/organizers.routes";
import organizerEventsRoutes from "./modules/events/organizerEvents.routes";
import eventsRoutes from "./modules/events/events.routes";
import categoriesRoutes from "./modules/categories/categories.routes";
import ordersRoutes from "./modules/orders/orders.routes";
import paymentsRoutes from "./modules/payments/payments.routes";
import ticketsRoutes from "./modules/tickets/tickets.routes";
import checkinsRoutes from "./modules/checkins/checkins.routes";
import adminRoutes from "./modules/admin/admin.routes";
import uploadsRoutes from "./modules/uploads/uploads.routes";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  // No cookies/credentials involved — auth is a Bearer token the client attaches
  // itself, so a plain origin allow-list (no `credentials: true`) is sufficient.
  app.use(
    cors({
      origin: env.WEB_URL,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => res.getHeader("x-request-id") as string,
      autoLogging: { ignore: (req) => req.url === "/health" },
    }),
  );
  app.use(globalRateLimiter);

  app.use("/uploads", express.static(path.resolve(__dirname, "../public/uploads")));

  app.get("/health", (_req, res) => {
    sendSuccess(res, { status: "ok", timestamp: new Date().toISOString() });
  });

  const api = express.Router();
  api.use("/auth", authRoutes);
  api.use("/me", meRoutes);
  // More specific path registered before the parameterized "/organizers/:slug" route.
  api.use("/organizers/events", organizerEventsRoutes);
  api.use("/organizers", organizersRoutes);
  api.use("/events", eventsRoutes);
  api.use("/categories", categoriesRoutes);
  api.use("/orders", ordersRoutes);
  api.use("/payments", paymentsRoutes);
  api.use("/tickets", ticketsRoutes);
  api.use("/checkins", checkinsRoutes);
  api.use("/admin", adminRoutes);
  api.use("/uploads", uploadsRoutes);

  app.use("/api/v1", api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
