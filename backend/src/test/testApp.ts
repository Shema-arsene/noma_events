import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../app";

export async function setupTestDatabase() {
  const memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri());
  return {
    app: createApp(),
    teardown: async () => {
      await mongoose.disconnect();
      await memoryServer.stop();
    },
  };
}
