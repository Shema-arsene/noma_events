import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as usersController from "./users.controller";
import * as ordersController from "../orders/orders.controller";
import * as ticketsController from "../tickets/tickets.controller";
import * as eventsController from "../events/events.controller";
import * as checkinsController from "../checkins/checkins.controller";

const router = Router();

router.use(requireAuth());

router.get("/", usersController.getMe);
router.patch("/", usersController.updateMe);
router.get("/orders", ordersController.listMyOrders);
router.get("/tickets", ticketsController.listMyTickets);
router.get("/favorites", eventsController.listMyFavorites);
router.get("/scan-events", checkinsController.listMyAssignedEvents);

export default router;
