import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { connectDatabase, disconnectDatabase } from "./database/connection";
import { seedDatabase } from "./database/seed";
import { sweepExpiredOrders } from "./modules/orders/orders.service";
import { sweepCompletedEvents } from "./modules/events/events.service";

const SWEEP_INTERVAL_MS = 60 * 1000;

async function runSweeps(): Promise<void> {
  try {
    const [expiredOrders, completedEvents] = await Promise.all([sweepExpiredOrders(), sweepCompletedEvents()]);
    if (expiredOrders > 0 || completedEvents > 0) {
      logger.info({ expiredOrders, completedEvents }, "Periodic sweep completed");
    }
  } catch (err) {
    logger.error({ err }, "Periodic sweep failed");
  }
}

async function main(): Promise<void> {
  await connectDatabase();

  if (env.USE_IN_MEMORY_DB) {
    // The in-memory database is empty on every boot, so seed it automatically
    // to keep local development and demos immediately usable.
    await seedDatabase();
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`Noma Events API listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  const sweepInterval = setInterval(runSweeps, SWEEP_INTERVAL_MS);

  async function shutdown(signal: string): Promise<void> {
    logger.info(`Received ${signal}, shutting down gracefully`);
    clearInterval(sweepInterval);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  }

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
