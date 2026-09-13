import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { AppError } from "../common/errors";
import { logger } from "../config/logger";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: `Route introuvable: ${req.method} ${req.originalUrl}` },
    requestId: res.locals.requestId,
  });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const requestId = res.locals.requestId;

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId }, err.message);
    }
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
      requestId,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Données invalides", details: err.flatten() },
      requestId,
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      error: { code: "BAD_REQUEST", message: "Identifiant invalide" },
      requestId,
    });
    return;
  }

  if (err && typeof err === "object" && "code" in err && (err as { code: unknown }).code === 11000) {
    res.status(409).json({
      success: false,
      error: { code: "CONFLICT", message: "Cette ressource existe déjà" },
      requestId,
    });
    return;
  }

  logger.error({ err, requestId }, "Unhandled error");
  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Une erreur interne est survenue" },
    requestId,
  });
}
