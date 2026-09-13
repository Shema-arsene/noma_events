import pino from "pino";
import { env, isProd } from "./env";

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : "info",
  transport: isProd
    ? undefined
    : {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
      },
  redact: {
    paths: [
      "req.headers.authorization",
      "password",
      "passwordHash",
      "token",
      "accessToken",
      "refreshToken",
      "qrToken",
      "ticketCodeHash",
    ],
    censor: "[redacted]",
  },
});
