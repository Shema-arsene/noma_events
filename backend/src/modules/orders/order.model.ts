import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { OrderStatus, CURRENCY } from "../../types";

const orderItemSchema = new Schema(
  {
    ticketTypeId: { type: Schema.Types.ObjectId, ref: "TicketType", required: true },
    ticketTypeName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPriceXaf: { type: Number, required: true, min: 0 },
    totalXaf: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    attendee: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
    },
    subtotalXaf: { type: Number, required: true, min: 0 },
    feesXaf: { type: Number, required: true, min: 0, default: 0 },
    totalXaf: { type: Number, required: true, min: 0 },
    currency: { type: String, default: CURRENCY },
    status: { type: String, enum: Object.values(OrderStatus), default: OrderStatus.PENDING, index: true },
    expiresAt: { type: Date, index: true },
    paidAt: { type: Date },
    cancelledAt: { type: Date },
    ticketsIssuedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, expiresAt: 1 });

export type IOrder = InferSchemaType<typeof orderSchema> & { _id: Types.ObjectId };

export const OrderModel = model<IOrder>("Order", orderSchema);
