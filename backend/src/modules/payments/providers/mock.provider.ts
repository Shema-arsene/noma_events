import { nanoid } from "nanoid";
import { env } from "../../../config/env";
import { BadRequestError } from "../../../common/errors";
import type {
  PaymentInitialization,
  PaymentProvider,
  PaymentStatusResult,
  RefundResult,
  VerifiedPaymentEvent,
} from "../provider.types";

interface MockWebhookPayload {
  reference: string;
  outcome: "SUCCESS" | "FAILED";
  amountXaf: number;
  signature: string;
}

/**
 * Local, credential-free stand-in for a real mobile-money/card provider
 * (e.g. Airtel Money, Moov Money). It never auto-succeeds a payment — the
 * caller (a dev "mock checkout" screen) must explicitly post an outcome,
 * which is verified exactly like a real provider webhook would be.
 */
export class MockPaymentProvider implements PaymentProvider {
  async initializePayment(input: { orderId: string; amountXaf: number; currency: string }): Promise<PaymentInitialization> {
    const reference = `MOCK-${nanoid(12).toUpperCase()}`;
    return {
      reference,
      instructions: `Paiement simulé de ${input.amountXaf} ${input.currency}. Utilisez l'écran de paiement démo pour confirmer ou échouer ce paiement.`,
    };
  }

  async verifyWebhook(payload: unknown): Promise<VerifiedPaymentEvent> {
    const body = payload as Partial<MockWebhookPayload>;
    if (!body || typeof body !== "object" || !body.reference || !body.outcome || !body.signature) {
      throw new BadRequestError("Charge utile de webhook invalide");
    }
    if (body.signature !== env.PAYMENT_WEBHOOK_SECRET) {
      throw new BadRequestError("Signature de webhook invalide");
    }
    if (body.outcome !== "SUCCESS" && body.outcome !== "FAILED") {
      throw new BadRequestError("Statut de paiement invalide");
    }
    return {
      reference: body.reference,
      status: body.outcome,
      amountXaf: body.amountXaf ?? 0,
      raw: body,
    };
  }

  async getPaymentStatus(reference: string): Promise<PaymentStatusResult> {
    // The mock provider keeps no external ledger; callers should read
    // normalized status from our own Payment collection instead.
    return { reference, status: "PENDING" };
  }

  async refund(input: { reference: string; amountXaf: number }): Promise<RefundResult> {
    void input.amountXaf;
    return { success: true, reference: input.reference };
  }
}

export const mockPaymentProvider = new MockPaymentProvider();
