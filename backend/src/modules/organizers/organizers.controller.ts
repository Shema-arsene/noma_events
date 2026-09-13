import type { Request, Response } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { sendSuccess } from "../../common/response";
import { UnauthorizedError } from "../../common/errors";
import { param } from "../../common/params";
import { toOrganizerDTO } from "./organizer.mapper";
import * as organizersService from "./organizers.service";

export const createOrganizer = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const organizer = await organizersService.createOrganizer(req.user, req.body);
  sendSuccess(res, toOrganizerDTO(organizer), 201);
});

export const getMyOrganizer = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const organizer = await organizersService.getMyOrganizer(req.user._id.toString());
  sendSuccess(res, toOrganizerDTO(organizer));
});

export const updateMyOrganizer = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const mine = await organizersService.getMyOrganizer(req.user._id.toString());
  const organizer = await organizersService.updateOrganizer(mine._id.toString(), req.user, req.body);
  sendSuccess(res, toOrganizerDTO(organizer));
});

export const getOrganizerBySlug = asyncHandler(async (req: Request, res: Response) => {
  const organizer = await organizersService.getOrganizerBySlug(param(req, "slug"));
  sendSuccess(res, toOrganizerDTO(organizer));
});
