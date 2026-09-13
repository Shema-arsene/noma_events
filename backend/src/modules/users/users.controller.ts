import type { Request, Response } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { sendSuccess } from "../../common/response";
import { UnauthorizedError } from "../../common/errors";
import { toUserDTO } from "./user.mapper";

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  sendSuccess(res, { user: toUserDTO(req.user) });
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const { name, phone, locale } = req.body as { name?: string; phone?: string; locale?: string };
  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  if (locale !== undefined) req.user.locale = locale;
  await req.user.save();
  sendSuccess(res, { user: toUserDTO(req.user) });
});
