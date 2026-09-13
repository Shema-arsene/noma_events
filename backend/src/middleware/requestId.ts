import type { NextFunction, Request, Response } from "express";
import { nanoid } from "nanoid";

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header("x-request-id");
  const id = incoming && incoming.length <= 128 ? incoming : nanoid(12);
  res.locals.requestId = id;
  res.setHeader("x-request-id", id);
  next();
}
