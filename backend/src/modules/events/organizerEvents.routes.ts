import { Router } from "express";
import { UserRole } from "../../types";
import {
  createEventSchema,
  updateEventSchema,
  ticketTypeSchema,
  updateTicketTypeSchema,
  assignStaffSchema,
} from "../../validation";
import { validate } from "../../middleware/validate";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as eventsController from "./events.controller";
import * as ticketsController from "../tickets/tickets.controller";
import * as analyticsController from "../analytics/analytics.controller";
import * as checkinsController from "../checkins/checkins.controller";

const router = Router();

router.use(requireAuth(), requireRole(UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN));

router.get("/", eventsController.listMyOrganizerEvents);
router.post("/", validate(createEventSchema), eventsController.createEvent);
router.get("/:id", eventsController.getOwnedEvent);
router.patch("/:id", validate(updateEventSchema), eventsController.updateEvent);
router.post("/:id/publish", eventsController.publishEvent);
router.post("/:id/cancel", eventsController.cancelEvent);

router.get("/:id/ticket-types", eventsController.listTicketTypes);
router.post("/:id/ticket-types", validate(ticketTypeSchema), eventsController.addTicketType);
router.patch(
  "/:id/ticket-types/:ticketTypeId",
  validate(updateTicketTypeSchema),
  eventsController.updateTicketType,
);
router.delete("/:id/ticket-types/:ticketTypeId", eventsController.deleteTicketType);

router.get("/:id/attendees", ticketsController.listEventAttendees);
router.get("/:id/analytics", analyticsController.getEventAnalytics);

router.get("/:id/staff", checkinsController.listStaff);
router.post("/:id/staff", validate(assignStaffSchema), checkinsController.assignStaff);
router.delete("/:id/staff/:staffId", checkinsController.removeStaff);

router.get("/:id/checkins", checkinsController.scanHistory);
router.get("/:id/attendance-count", checkinsController.attendanceCount);

export default router;
