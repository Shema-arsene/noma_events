import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as ticketsController from "./tickets.controller";

const router = Router();

router.get("/:id", requireAuth(), ticketsController.getTicket);

export default router;
