import path from "node:path";
import fs from "node:fs";
import dotenv from "dotenv";
import { z } from "zod";

// Load backend/.env. Checks process.cwd() first (covers running `npm run dev`
// from within this project, the normal case) and falls back to a path
// resolved from this file's own location (covers being started with a
// different working directory, e.g. some process managers).
const candidates = [path.resolve(process.cwd(), ".env"), path.resolve(__dirname, "../../.env")];
for (const candidate of candidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
    break;
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  WEB_URL: z.string().default("http://localhost:3000"),
  API_URL: z.string().default("http://localhost:4000"),
  MONGODB_URI: z.string().default("mongodb://localhost:27017/noma_events"),
  REDIS_URL: z.string().optional(),
  // When true, the API boots an in-memory MongoDB instead of dialing MONGODB_URI,
  // so local development needs no Docker/DB install. Defaults to true outside
  // production and false in production, so a deployment that forgets to set this
  // explicitly fails loudly on a real MONGODB_URI instead of silently discarding data.
  //
  // NOTE: this is deliberately not z.coerce.boolean() — coerce uses JS's
  // Boolean(x), and Boolean("false") is true (any non-empty string is
  // truthy), which would silently ignore USE_IN_MEMORY_DB=false. Parse the
  // "true"/"false" text explicitly instead.
  USE_IN_MEMORY_DB: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? process.env.NODE_ENV !== "production" : v.trim().toLowerCase() === "true")),

  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 characters"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 characters"),

  STORAGE_PROVIDER: z.enum(["local", "cloudinary"]).default("local"),
  STORAGE_CLOUD_NAME: z.string().optional(),
  STORAGE_API_KEY: z.string().optional(),
  STORAGE_API_SECRET: z.string().optional(),

  PAYMENT_PROVIDER: z.enum(["mock"]).default("mock"),
  PAYMENT_API_KEY: z.string().default("mock_key"),
  PAYMENT_WEBHOOK_SECRET: z.string().default("mock_webhook_secret"),

  EMAIL_PROVIDER: z.enum(["dev", "smtp"]).default("dev"),
  EMAIL_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration. Check your .env file against .env.example.");
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
