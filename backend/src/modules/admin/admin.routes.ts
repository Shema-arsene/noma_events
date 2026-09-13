import { Router } from "express";
import { UserRole } from "../../types";
import { moderateOrganizerSchema, suspendUserSchema } from "../../validation";
import { validate } from "../../middleware/validate";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as adminController from "./admin.controller";

const router = Router();

router.use(requireAuth(), requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN));

router.get("/overview", adminController.getOverview);

router.get("/users", adminController.listUsers);
router.patch("/users/:id/status", validate(suspendUserSchema), adminController.suspendUser);

router.get("/organizers", adminController.listOrganizers);
router.patch("/organizers/:id/status", validate(moderateOrganizerSchema), adminController.moderateOrganizer);

router.get("/events", adminController.listEvents);
router.post("/events/:id/cancel", adminController.cancelEvent);

router.get("/orders", adminController.listOrders);

router.get("/audit-logs", adminController.listAuditLogs);

export default router;
