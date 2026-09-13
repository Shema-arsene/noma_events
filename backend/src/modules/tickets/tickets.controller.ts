import type { Request, Response } from "express";
import { TicketStatus } from "../../types";
import { asyncHandler } from "../../common/asyncHandler";
import { sendSuccess } from "../../common/response";
import { UnauthorizedError } from "../../common/errors";
import { param } from "../../common/params";
import { toTicketDTO } from "./ticket.mapper";
import { buildQrPayload, generateQrImage } from "./qr.service";
import * as ticketsService from "./tickets.service";

export const listMyTickets = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const tickets = await ticketsService.listMyTickets(req.user._id.toString());
  sendSuccess(
    res,
    tickets.map((t) => toTicketDTO(t as never)),
  );
});

export const getTicket = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const ticket = await ticketsService.getTicketForOwner(param(req, "id"), req.user);

  let qrImage: string | undefined;
  if (ticket.status === TicketStatus.ACTIVE) {
    const payload = buildQrPayload(ticket._id.toString(), ticket.qrSecret);
    qrImage = await generateQrImage(payload);
  }

  sendSuccess(res, toTicketDTO(ticket as never, qrImage));
});

export const listEventAttendees = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const attendees = await ticketsService.listEventAttendees(param(req, "id"), req.user);
  sendSuccess(
    res,
    attendees.map((t) => ({
      id: t._id.toString(),
      attendeeName: t.attendeeName,
      ticketTypeName: t.ticketTypeName,
      displayCode: t.displayCode,
      status: t.status,
      issuedAt: t.issuedAt,
      usedAt: t.usedAt,
    })),
  );
});
