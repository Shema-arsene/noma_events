import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../types";
import { UserStatus } from "../types";
import { verifyAccessToken } from "../common/tokens";
import { ForbiddenError, UnauthorizedError } from "../common/errors";
import { UserModel } from "../modules/users/user.model";

function extractToken(req: Request): string | null {
  const header = req.header("authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
}

export function requireAuth() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extractToken(req);
      if (!token) throw new UnauthorizedError();

      const payload = verifyAccessToken(token);
      const user = await UserModel.findById(payload.sub);
      if (!user || user.tokenVersion !== payload.tokenVersion) {
        throw new UnauthorizedError();
      }
      if (user.status !== UserStatus.ACTIVE) {
        throw new ForbiddenError("Ce compte est suspendu ou désactivé");
      }
      req.user = user;
      next();
    } catch (err) {
      if (err instanceof ForbiddenError) {
        next(err);
        return;
      }
      next(new UnauthorizedError());
    }
  };
}

/** Attaches req.user when a valid token is present, but never rejects the request. */
export function optionalAuth() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extractToken(req);
      if (!token) {
        next();
        return;
      }
      const payload = verifyAccessToken(token);
      const user = await UserModel.findById(payload.sub);
      if (user && user.tokenVersion === payload.tokenVersion && user.status === UserStatus.ACTIVE) {
        req.user = user;
      }
      next();
    } catch {
      next();
    }
  };
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (!roles.includes(req.user.role as UserRole)) {
      next(new ForbiddenError());
      return;
    }
    next();
  };
}
