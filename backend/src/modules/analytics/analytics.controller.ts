import type { Request, Response } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { sendSuccess } from "../../common/response";
import { UnauthorizedError } from "../../common/errors";
import { param } from "../../common/params";
import * as analyticsService from "./analytics.service";

export const getEventAnalytics = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const analytics = await analyticsService.getEventAnalytics(param(req, "id"), req.user);
  sendSuccess(res, analytics);
});
