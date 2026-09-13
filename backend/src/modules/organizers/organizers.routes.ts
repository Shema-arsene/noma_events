import { Router } from "express";
import { createOrganizerSchema, updateOrganizerSchema } from "../../validation";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import * as organizersController from "./organizers.controller";

const router = Router();

router.post("/", requireAuth(), validate(createOrganizerSchema), organizersController.createOrganizer);
router.get("/me", requireAuth(), organizersController.getMyOrganizer);
router.patch("/me", requireAuth(), validate(updateOrganizerSchema), organizersController.updateMyOrganizer);
router.get("/:slug", organizersController.getOrganizerBySlug);

export default router;
