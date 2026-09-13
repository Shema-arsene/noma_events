import type { Request, Response } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { param } from "../../common/params";
import { sendSuccess, buildPaginationMeta } from "../../common/response";
import { UnauthorizedError } from "../../common/errors";
import { toUserDTO } from "../users/user.mapper";
import { toOrganizerDTO } from "../organizers/organizer.mapper";
import * as organizersService from "../organizers/organizers.service";
import * as adminService from "./admin.service";

export const getOverview = asyncHandler(async (_req: Request, res: Response) => {
  const overview = await adminService.getOverview();
  sendSuccess(res, overview);
});

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const { users, total } = await adminService.listUsers(page, limit);
  sendSuccess(res, users.map(toUserDTO), 200, buildPaginationMeta(page, limit, total));
});

export const suspendUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const user = await adminService.suspendUser(param(req, "id"), req.user._id.toString(), req.body);
  sendSuccess(res, toUserDTO(user));
});

export const listOrganizers = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const status = req.query.status as never;
  const { organizers, total } = await adminService.listOrganizers(status, page, limit);
  sendSuccess(res, organizers.map(toOrganizerDTO), 200, buildPaginationMeta(page, limit, total));
});

export const moderateOrganizer = asyncHandler(async (req: Request, res: Response) => {
  const { status, reason } = req.body as { status: never; reason?: string };
  const organizer = await organizersService.moderateOrganizer(param(req, "id"), status, reason);
  sendSuccess(res, toOrganizerDTO(organizer));
});

export const listEvents = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const status = req.query.status as never;
  const { events, total } = await adminService.listEvents(status, page, limit);
  const dtos = events.map((e) => {
    const populated = e as unknown as {
      _id: { toString(): string };
      title: string;
      slug: string;
      status: string;
      city: string;
      startAt: Date;
      coverImage?: string;
      organizerId: { name: string; slug: string };
      categoryId?: { name: string; slug: string };
    };
    return {
      id: populated._id.toString(),
      title: populated.title,
      slug: populated.slug,
      status: populated.status,
      city: populated.city,
      startAt: populated.startAt.toISOString(),
      coverImage: populated.coverImage,
      organizerName: populated.organizerId?.name,
      categoryName: populated.categoryId?.name,
    };
  });
  sendSuccess(res, dtos, 200, buildPaginationMeta(page, limit, total));
});

export const cancelEvent = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const event = await adminService.adminCancelEvent(param(req, "id"), req.user._id.toString());
  sendSuccess(res, { id: event._id.toString(), status: event.status });
});

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const { orders, total } = await adminService.listOrders(page, limit);
  const dtos = orders.map((o) => {
    const populated = o as unknown as {
      _id: { toString(): string };
      orderNumber: string;
      totalXaf: number;
      status: string;
      createdAt: Date;
      eventId?: { title: string; slug: string };
    };
    return {
      id: populated._id.toString(),
      orderNumber: populated.orderNumber,
      totalXaf: populated.totalXaf,
      status: populated.status,
      createdAt: populated.createdAt.toISOString(),
      eventTitle: populated.eventId?.title,
      eventSlug: populated.eventId?.slug,
    };
  });
  sendSuccess(res, dtos, 200, buildPaginationMeta(page, limit, total));
});

export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const { logs, total } = await adminService.listAuditLogs(page, limit);
  sendSuccess(res, logs, 200, buildPaginationMeta(page, limit, total));
});
