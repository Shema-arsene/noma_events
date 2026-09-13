import type { Request, Response } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../../common/response";
import { UnauthorizedError } from "../../common/errors";
import { param } from "../../common/params";
import { toEventDTO, type PopulatedEvent } from "./event.mapper";
import { toTicketTypeDTO } from "./ticketType.mapper";
import * as eventsService from "./events.service";
import * as ticketTypesService from "./ticketTypes.service";

export const searchEvents = asyncHandler(async (_req: Request, res: Response) => {
  // Express 5 makes req.query getter-only, so the validate("query") middleware
  // stashes the parsed/coerced result on res.locals.query instead of req.query.
  const query = res.locals.query as Parameters<typeof eventsService.searchPublicEvents>[0];
  const { events, total } = await eventsService.searchPublicEvents(query);
  const dtos = events.map((e) => toEventDTO(e as unknown as PopulatedEvent));
  sendSuccess(res, dtos, 200, buildPaginationMeta(query.page, query.limit, total));
});

export const getEventBySlug = asyncHandler(async (req: Request, res: Response) => {
  const event = await eventsService.getPublicEventBySlug(param(req, "slug"), req.user);
  const ticketTypes = await ticketTypesService.listTicketTypesForEvent(event._id.toString(), true);
  sendSuccess(res, toEventDTO(event, ticketTypes.map(toTicketTypeDTO)));
});

export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const event = await eventsService.createEvent(req.user, req.body);
  const ticketTypes = await ticketTypesService.listTicketTypesForEvent(event._id.toString());
  sendSuccess(res, toEventDTO(event, ticketTypes.map(toTicketTypeDTO)), 201);
});

export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const event = await eventsService.updateEvent(param(req, "id"), req.user, req.body);
  const ticketTypes = await ticketTypesService.listTicketTypesForEvent(event._id.toString());
  sendSuccess(res, toEventDTO(event, ticketTypes.map(toTicketTypeDTO)));
});

export const publishEvent = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const event = await eventsService.publishEvent(param(req, "id"), req.user);
  sendSuccess(res, toEventDTO(event));
});

export const cancelEvent = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const event = await eventsService.cancelEvent(param(req, "id"), req.user);
  sendSuccess(res, toEventDTO(event));
});

export const getOwnedEvent = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const event = await eventsService.getEventByIdForOwner(param(req, "id"), req.user);
  const ticketTypes = await ticketTypesService.listTicketTypesForEvent(event._id.toString());
  sendSuccess(res, toEventDTO(event, ticketTypes.map(toTicketTypeDTO)));
});

export const listMyOrganizerEvents = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const organizerId = req.query.organizerId as string;
  const events = await eventsService.listOrganizerEvents(organizerId, req.user);
  sendSuccess(res, events.map((e) => toEventDTO(e as unknown as PopulatedEvent)));
});

export const listTicketTypes = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const eventId = param(req, "id");
  await eventsService.getEventByIdForOwner(eventId, req.user);
  const ticketTypes = await ticketTypesService.listTicketTypesForEvent(eventId);
  sendSuccess(res, ticketTypes.map(toTicketTypeDTO));
});

export const addTicketType = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const eventId = param(req, "id");
  await eventsService.getEventByIdForOwner(eventId, req.user);
  const ticketType = await ticketTypesService.addTicketType(eventId, req.body);
  sendSuccess(res, toTicketTypeDTO(ticketType), 201);
});

export const updateTicketType = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const eventId = param(req, "id");
  await eventsService.getEventByIdForOwner(eventId, req.user);
  const ticketType = await ticketTypesService.updateTicketType(eventId, param(req, "ticketTypeId"), req.body);
  sendSuccess(res, toTicketTypeDTO(ticketType));
});

export const deleteTicketType = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const eventId = param(req, "id");
  await eventsService.getEventByIdForOwner(eventId, req.user);
  await ticketTypesService.deleteTicketType(eventId, param(req, "ticketTypeId"));
  sendSuccess(res, { deleted: true });
});

export const toggleFavorite = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const result = await eventsService.toggleFavorite(req.user._id.toString(), param(req, "id"));
  sendSuccess(res, result);
});

export const listMyFavorites = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const events = await eventsService.listMyFavorites(req.user._id.toString());
  sendSuccess(res, events.map((e) => toEventDTO(e as unknown as PopulatedEvent)));
});
