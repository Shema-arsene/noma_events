import type { Response } from "express";
import type { PaginationMeta } from "../types";

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, meta?: PaginationMeta): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
    requestId: res.locals.requestId,
  });
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
