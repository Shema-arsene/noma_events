import { OrderStatus, PaymentStatus, NotificationType } from "../../types";
import { env } from "../../config/env";
import { OrderModel } from "../orders/order.model";
import { PaymentModel } from "./payment.model";
import type { UserDocument } from "../users/user.model";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../common/errors";
import { notify } from "../notifications/notifications.service";
import { issueTicketsForOrder } from "../tickets/tickets.service";
import { mockPaymentProvider } from "./providers/mock.provider";
import type { PaymentProvider } from "./provider.types";
import { logger } from "../../config/logger";

function getProvider(name: string): PaymentProvider {
  if (name === "mock") return mockPaymentProvider;
  throw new BadRequestError(`Fournisseur de paiement inconnu: ${name}`);
}

export async function initializePayment(
  orderId: string,
  requester: UserDocument,
  providerName: string = env.PAYMENT_PROVIDER,
) {
  const order = await OrderModel.findById(orderId);
  if (!order) throw new NotFoundError("Commande introuvable");
  if (order.userId.toString() !== requester._id.toString()) {
    throw new ForbiddenError("Vous n'avez pas accès à cette commande");
  }
  if (order.status !== OrderStatus.PENDING) {
    throw new BadRequestError("Cette commande n'est plus en attente de paiement");
  }
  if (order.expiresAt && order.expiresAt < new Date()) {
    throw new BadRequestError("Cette commande a expiré");
  }

  const provider = getProvider(providerName);
  const initialization = await provider.initializePayment({
    orderId: order._id.toString(),
    amountXaf: order.totalXaf,
    currency: order.currency,
  });

  const payment = await PaymentModel.create({
    orderId: order._id,
    provider: providerName,
    providerReference: initialization.reference,
    amountXaf: order.totalXaf,
    currency: order.currency,
    status: PaymentStatus.PENDING,
  });

  return { payment, initialization };
}

export async function handleWebhook(providerName: string, payload: unknown, signatureHeader?: string) {
  const provider = getProvider(providerName);
  const event = await provider.verifyWebhook(payload, signatureHeader);

  const payment = await PaymentModel.findOne({ providerReference: event.reference });
  if (!payment) {
    logger.warn({ reference: event.reference }, "Webhook received for unknown payment reference");
    throw new NotFoundError("Paiement introuvable");
  }

  const nextStatus = event.status === "SUCCESS" ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;

  // Atomically claim the PENDING -> final transition so duplicate webhook
  // deliveries are no-ops (idempotent by construction).
  const claimed = await PaymentModel.findOneAndUpdate(
    { _id: payment._id, status: PaymentStatus.PENDING },
    { status: nextStatus, verifiedAt: new Date(), metadata: event.raw },
    { returnDocument: "after" },
  );

  if (!claimed) {
    return { alreadyProcessed: true, status: payment.status };
  }

  const order = await OrderModel.findById(payment.orderId);
  if (!order) {
    logger.error({ orderId: payment.orderId }, "Payment succeeded for missing order");
    return { alreadyProcessed: false, status: claimed.status };
  }

  if (nextStatus === PaymentStatus.SUCCESS) {
    order.status = OrderStatus.PAID;
    order.paidAt = new Date();
    await order.save();

    await issueTicketsForOrder(order);

    await notify({
      userId: order.userId,
      type: NotificationType.PURCHASE_CONFIRMATION,
      title: "Votre billet est confirmé",
      body: `Votre paiement pour la commande ${order.orderNumber} a été confirmé.`,
    });
  } else {
    order.status = OrderStatus.FAILED;
    await order.save();

    await notify({
      userId: order.userId,
      type: NotificationType.PAYMENT_FAILED,
      title: "Échec du paiement",
      body: `Le paiement de la commande ${order.orderNumber} a échoué. Vous pouvez réessayer.`,
    });
  }

  return { alreadyProcessed: false, status: claimed.status };
}

export async function getPaymentForOrder(orderId: string) {
  return PaymentModel.findOne({ orderId }).sort({ createdAt: -1 });
}
