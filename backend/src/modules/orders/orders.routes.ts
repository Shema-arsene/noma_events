import { Router } from "express";
import { createOrderSchema } from "../../validation";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import { checkoutRateLimiter } from "../../middleware/rateLimit";
import * as ordersController from "./orders.controller";

const router = Router();

router.post("/", requireAuth(), checkoutRateLimiter, validate(createOrderSchema), ordersController.createOrder);
router.get("/:id", requireAuth(), ordersController.getOrder);

export default router;
