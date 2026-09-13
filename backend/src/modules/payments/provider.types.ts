export interface PaymentInitialization {
  reference: string;
  redirectUrl?: string;
  instructions?: string;
}

export interface VerifiedPaymentEvent {
  reference: string;
  status: "SUCCESS" | "FAILED";
  amountXaf: number;
  raw?: unknown;
}

export interface PaymentStatusResult {
  reference: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
}

export interface RefundResult {
  success: boolean;
  reference: string;
}

export interface PaymentProvider {
  initializePayment(input: { orderId: string; amountXaf: number; currency: string }): Promise<PaymentInitialization>;
  verifyWebhook(payload: unknown, signatureHeader?: string): Promise<VerifiedPaymentEvent>;
  getPaymentStatus(reference: string): Promise<PaymentStatusResult>;
  refund(input: { reference: string; amountXaf: number }): Promise<RefundResult>;
}
