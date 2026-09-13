import mongoose from "mongoose";
import { CheckInResult, EventStatus, TicketStatus, UserRole } from "../../types";
import type { AssignStaffInput, ScanTicketInput } from "../../validation";
import { EventStaffModel } from "./eventStaff.model";
import { CheckInModel } from "./checkin.model";
import { EventModel } from "../events/event.model";
import { TicketModel } from "../tickets/ticket.model";
import { UserModel, type UserDocument } from "../users/user.model";
import { assertOrganizerOwnership } from "../events/events.service";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../common/errors";
import { hashToken, safeCompare } from "../../common/crypto";
import { parseQrPayload } from "../tickets/qr.service";

export async function assignStaff(eventId: string, requester: UserDocument, input: AssignStaffInput) {
  const event = await EventModel.findById(eventId);
  if (!event) throw new NotFoundError("Événement introuvable");
  await assertOrganizerOwnership(event.organizerId.toString(), requester);

  const staffUser = await UserModel.findOne({ email: input.email });
  if (!staffUser) {
    throw new BadRequestError("Aucun compte trouvé avec cette adresse e-mail. Demandez-lui de créer un compte d'abord.");
  }

  if (staffUser.role === UserRole.ATTENDEE) {
    staffUser.role = UserRole.EVENT_STAFF;
    await staffUser.save();
  }

  const staff = await EventStaffModel.findOneAndUpdate(
    { eventId, userId: staffUser._id },
    { permissions: input.permissions, active: true },
    { upsert: true, returnDocument: "after" },
  );

  return staff.populate<{ userId: { _id: unknown; name: string; email: string } }>("userId", "name email");
}

export async function listStaff(eventId: string, requester: UserDocument) {
  const event = await EventModel.findById(eventId);
  if (!event) throw new NotFoundError("Événement introuvable");
  await assertOrganizerOwnership(event.organizerId.toString(), requester);

  return EventStaffModel.find({ eventId }).populate<{ userId: { _id: unknown; name: string; email: string } }>(
    "userId",
    "name email",
  );
}

export async function removeStaff(eventId: string, staffId: string, requester: UserDocument) {
  const event = await EventModel.findById(eventId);
  if (!event) throw new NotFoundError("Événement introuvable");
  await assertOrganizerOwnership(event.organizerId.toString(), requester);

  const staff = await EventStaffModel.findOne({ _id: staffId, eventId });
  if (!staff) throw new NotFoundError("Membre du personnel introuvable");
  staff.active = false;
  await staff.save();
}

async function isAuthorizedForEvent(eventId: string, staffUser: UserDocument): Promise<boolean> {
  if (staffUser.role === UserRole.ADMIN || staffUser.role === UserRole.SUPER_ADMIN) return true;

  const event = await EventModel.findById(eventId);
  if (!event) return false;

  const assignment = await EventStaffModel.findOne({ eventId, userId: staffUser._id, active: true });
  if (assignment) return true;

  // Organizer owner scanning their own event directly.
  const { OrganizerModel } = await import("../organizers/organizer.model.js");
  const organizer = await OrganizerModel.findById(event.organizerId);
  return organizer?.ownerUserId.toString() === staffUser._id.toString();
}

export async function assertScanAccess(eventId: string, user: UserDocument): Promise<void> {
  const authorized = await isAuthorizedForEvent(eventId, user);
  if (!authorized) {
    throw new ForbiddenError("Vous n'êtes pas autorisé pour cet événement");
  }
}

export async function scanTicket(input: ScanTicketInput, staffUser: UserDocument) {
  await assertScanAccess(input.eventId, staffUser);

  const parsed = parseQrPayload(input.qrToken);
  if (!parsed || !mongoose.isValidObjectId(parsed.ticketId)) {
    await logCheckIn(undefined, input.eventId, staffUser, CheckInResult.INVALID, input.deviceReference);
    return { result: CheckInResult.INVALID };
  }

  const ticket = await TicketModel.findById(parsed.ticketId).select("+ticketCodeHash");
  if (!ticket || !safeCompare(ticket.ticketCodeHash, hashToken(parsed.rawToken))) {
    await logCheckIn(ticket?._id.toString(), input.eventId, staffUser, CheckInResult.INVALID, input.deviceReference);
    return { result: CheckInResult.INVALID };
  }

  if (ticket.eventId.toString() !== input.eventId) {
    await logCheckIn(ticket._id.toString(), input.eventId, staffUser, CheckInResult.WRONG_EVENT, input.deviceReference);
    return { result: CheckInResult.WRONG_EVENT };
  }

  if (ticket.status === TicketStatus.CANCELLED) {
    await logCheckIn(ticket._id.toString(), input.eventId, staffUser, CheckInResult.CANCELLED, input.deviceReference);
    return { result: CheckInResult.CANCELLED };
  }
  if (ticket.status === TicketStatus.REFUNDED) {
    await logCheckIn(ticket._id.toString(), input.eventId, staffUser, CheckInResult.REFUNDED, input.deviceReference);
    return { result: CheckInResult.REFUNDED };
  }
  if (ticket.status === TicketStatus.USED) {
    await logCheckIn(ticket._id.toString(), input.eventId, staffUser, CheckInResult.ALREADY_USED, input.deviceReference);
    return { result: CheckInResult.ALREADY_USED, ticket: minimalTicketInfo(ticket) };
  }

  // Atomic ACTIVE -> USED transition; if another concurrent scan won the race, treat as ALREADY_USED.
  const updated = await TicketModel.findOneAndUpdate(
    { _id: ticket._id, status: TicketStatus.ACTIVE },
    { status: TicketStatus.USED, usedAt: new Date() },
    { returnDocument: "after" },
  );

  if (!updated) {
    await logCheckIn(ticket._id.toString(), input.eventId, staffUser, CheckInResult.ALREADY_USED, input.deviceReference);
    return { result: CheckInResult.ALREADY_USED, ticket: minimalTicketInfo(ticket) };
  }

  await logCheckIn(updated._id.toString(), input.eventId, staffUser, CheckInResult.VALID, input.deviceReference);
  return { result: CheckInResult.VALID, ticket: minimalTicketInfo(updated) };
}

function minimalTicketInfo(ticket: { attendeeName: string; ticketTypeName: string; displayCode: string }) {
  return {
    attendeeName: ticket.attendeeName,
    ticketTypeName: ticket.ticketTypeName,
    displayCode: ticket.displayCode,
  };
}

async function logCheckIn(
  ticketId: string | undefined,
  eventId: string,
  staffUser: UserDocument,
  result: CheckInResult,
  deviceReference?: string,
) {
  await CheckInModel.create({
    ticketId: ticketId || undefined,
    eventId,
    staffUserId: staffUser._id,
    result,
    deviceReference,
  });
}

export async function getScanHistory(eventId: string, requester: UserDocument) {
  const event = await EventModel.findById(eventId);
  if (!event) throw new NotFoundError("Événement introuvable");
  await assertScanAccess(eventId, requester);

  return CheckInModel.find({ eventId }).sort({ scannedAt: -1 }).limit(200);
}

export async function getAttendanceCount(eventId: string, requester: UserDocument): Promise<number> {
  await assertScanAccess(eventId, requester);
  return TicketModel.countDocuments({ eventId, status: TicketStatus.USED });
}

/** Events the current user is allowed to scan: their own organizer's events, plus any explicit staff assignments. */
export async function listAssignedEvents(user: UserDocument) {
  const { OrganizerModel } = await import("../organizers/organizer.model.js");

  const [ownedOrganizers, assignments] = await Promise.all([
    OrganizerModel.find({ ownerUserId: user._id }).select("_id"),
    EventStaffModel.find({ userId: user._id, active: true }).select("eventId"),
  ]);

  const organizerIds = ownedOrganizers.map((o) => o._id);
  const assignedEventIds = assignments.map((a) => a.eventId);

  const events = await EventModel.find({
    status: { $in: [EventStatus.PUBLISHED, EventStatus.COMPLETED] },
    $or: [{ organizerId: { $in: organizerIds } }, { _id: { $in: assignedEventIds } }],
  })
    .select("title slug startAt city status coverImage")
    .sort({ startAt: -1 });

  return events;
}
