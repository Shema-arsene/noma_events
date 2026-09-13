import mongoose from "mongoose";
import { env } from "../config/env";
import { logger } from "../config/logger";

let memoryServerStop: (() => Promise<void>) | null = null;

export async function connectDatabase(): Promise<void> {
  let uri = env.MONGODB_URI;

  if (env.USE_IN_MEMORY_DB) {
    // Lazy-loaded so production builds that never enable this flag don't need
    // mongodb-memory-server installed as a production dependency.
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const memoryServer = await MongoMemoryServer.create({
      instance: { dbName: "noma_events" },
    });
    uri = memoryServer.getUri();
    memoryServerStop = async () => {
      await memoryServer.stop();
    };
    logger.info({ uri }, "Starting in-memory MongoDB for local development");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  logger.info("MongoDB connected");

  mongoose.connection.on("error", (err) => {
    logger.error({ err }, "MongoDB connection error");
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServerStop) {
    await memoryServerStop();
    memoryServerStop = null;
  }
}
