import { Router } from "express";
import { eventQuerySchema } from "../../validation";
import { validate } from "../../middleware/validate";
import { requireAuth, optionalAuth } from "../../middleware/auth";
import * as eventsController from "./events.controller";

const router = Router();

router.get("/", validate(eventQuerySchema, "query"), eventsController.searchEvents);
router.get("/:slug", optionalAuth(), eventsController.getEventBySlug);
router.post("/:id/favorite", requireAuth(), eventsController.toggleFavorite);

export default router;
