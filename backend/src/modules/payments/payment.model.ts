import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { PaymentStatus, CURRENCY } from "../../types";

const paymentSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    provider: { type: String, required: true, default: "mock" },
    providerReference: { type: String, required: true, unique: true, index: true },
    amountXaf: { type: Number, required: true, min: 0 },
    currency: { type: String, default: CURRENCY },
    status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING, index: true },
    metadata: { type: Schema.Types.Mixed },
    verifiedAt: { type: Date },
  },
  { timestamps: true },
);

export type IPayment = InferSchemaType<typeof paymentSchema> & { _id: Types.ObjectId };

export const PaymentModel = model<IPayment>("Payment", paymentSchema);
