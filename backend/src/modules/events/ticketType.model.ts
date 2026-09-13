import { Schema, model, Types, type InferSchemaType } from "mongoose";

const ticketTypeSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    priceXaf: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    soldQuantity: { type: Number, default: 0, min: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 },
    salesStartAt: { type: Date, required: true },
    salesEndAt: { type: Date, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

ticketTypeSchema.index({ eventId: 1, active: 1 });

export type ITicketType = InferSchemaType<typeof ticketTypeSchema> & { _id: Types.ObjectId };

export const TicketTypeModel = model<ITicketType>("TicketType", ticketTypeSchema);
