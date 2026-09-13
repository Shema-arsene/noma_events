import { Router } from "express";
import { initializePaymentSchema } from "../../validation";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import { checkoutRateLimiter } from "../../middleware/rateLimit";
import * as paymentsController from "./payments.controller";

const router = Router();

router.post(
  "/:provider/initialize",
  requireAuth(),
  checkoutRateLimiter,
  validate(initializePaymentSchema),
  paymentsController.initializePayment,
);
router.post("/:provider/webhook", paymentsController.webhook);
router.post("/mock/simulate", requireAuth(), paymentsController.simulateMockOutcome);

export default router;
