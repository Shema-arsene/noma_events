import { Router } from "express";
import { scanTicketSchema } from "../../validation";
import { validate } from "../../middleware/validate";
import { requireAuth, requireRole } from "../../middleware/auth";
import { scanRateLimiter } from "../../middleware/rateLimit";
import { UserRole } from "../../types";
import * as checkinsController from "./checkins.controller";

const router = Router();

router.use(requireAuth(), requireRole(UserRole.EVENT_STAFF, UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN));

router.post("/scan", scanRateLimiter, validate(scanTicketSchema), checkinsController.scan);
router.get("/:id/attendance-count", checkinsController.attendanceCount);
router.get("/:id/history", checkinsController.scanHistory);

export default router;
