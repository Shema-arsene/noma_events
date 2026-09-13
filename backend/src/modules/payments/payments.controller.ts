import type { Request, Response } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { sendSuccess } from "../../common/response";
import { UnauthorizedError, BadRequestError, ForbiddenError, NotFoundError } from "../../common/errors";
import { param } from "../../common/params";
import { env } from "../../config/env";
import { OrderModel } from "../orders/order.model";
import { PaymentModel } from "./payment.model";
import * as paymentsService from "./payments.service";

export const initializePayment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const { orderId } = req.body as { orderId: string };
  const { payment, initialization } = await paymentsService.initializePayment(orderId, req.user, param(req, "provider"));
  sendSuccess(
    res,
    {
      paymentId: payment._id.toString(),
      provider: payment.provider,
      reference: payment.providerReference,
      redirectUrl: initialization.redirectUrl,
      instructions: initialization.instructions,
    },
    201,
  );
});

export const webhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.header("x-webhook-signature");
  const result = await paymentsService.handleWebhook(param(req, "provider"), req.body, signature);
  sendSuccess(res, result);
});

/**
 * Dev-only endpoint that lets the mock checkout screen "act as" the payment
 * provider by driving the same handleWebhook code path a real webhook would.
 * The shared webhook secret stays server-side; only order ownership is checked.
 */
export const simulateMockOutcome = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  if (env.PAYMENT_PROVIDER !== "mock") throw new BadRequestError("Le fournisseur mock n'est pas actif");

  const { reference, outcome } = req.body as { reference: string; outcome: "SUCCESS" | "FAILED" };
  const payment = await PaymentModel.findOne({ providerReference: reference });
  if (!payment) throw new NotFoundError("Paiement introuvable");

  const order = await OrderModel.findById(payment.orderId);
  if (!order || order.userId.toString() !== req.user._id.toString()) {
    throw new ForbiddenError("Vous n'avez pas accès à ce paiement");
  }

  const result = await paymentsService.handleWebhook(
    "mock",
    { reference, outcome, amountXaf: payment.amountXaf, signature: env.PAYMENT_WEBHOOK_SECRET },
    undefined,
  );
  sendSuccess(res, result);
});
