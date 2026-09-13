import type { Request, Response } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { sendSuccess } from "../../common/response";
import { UnauthorizedError } from "../../common/errors";
import { param } from "../../common/params";
import { toEventStaffDTO } from "./eventStaff.mapper";
import * as checkinsService from "./checkins.service";

export const assignStaff = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const staff = await checkinsService.assignStaff(param(req, "id"), req.user, req.body);
  sendSuccess(res, toEventStaffDTO(staff as never), 201);
});

export const listStaff = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const staff = await checkinsService.listStaff(param(req, "id"), req.user);
  sendSuccess(res, staff.map((s) => toEventStaffDTO(s as never)));
});

export const removeStaff = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  await checkinsService.removeStaff(param(req, "id"), param(req, "staffId"), req.user);
  sendSuccess(res, { removed: true });
});

export const scan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const result = await checkinsService.scanTicket(req.body, req.user);
  sendSuccess(res, result);
});

export const scanHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const history = await checkinsService.getScanHistory(param(req, "id"), req.user);
  sendSuccess(res, history);
});

export const attendanceCount = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const count = await checkinsService.getAttendanceCount(param(req, "id"), req.user);
  sendSuccess(res, { count });
});

export const listMyAssignedEvents = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const events = await checkinsService.listAssignedEvents(req.user);
  sendSuccess(
    res,
    events.map((e) => ({
      id: e._id.toString(),
      title: e.title,
      slug: e.slug,
      startAt: e.startAt.toISOString(),
      city: e.city,
      status: e.status,
      coverImage: e.coverImage,
    })),
  );
});
