import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { TicketStatus } from "../../types";

const ticketSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    ticketTypeId: { type: Schema.Types.ObjectId, ref: "TicketType", required: true },
    ticketTypeName: { type: String, required: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    attendeeName: { type: String, required: true },
    // Hash used for scan-time verification (never need to load the raw secret to check it).
    ticketCodeHash: { type: String, required: true, select: false },
    // Raw high-entropy secret, hidden by default; selected only to regenerate the QR
    // image for the authenticated ticket owner (wallet view) or event organizer.
    qrSecret: { type: String, required: true, select: false },
    displayCode: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: Object.values(TicketStatus), default: TicketStatus.ACTIVE, index: true },
    issuedAt: { type: Date, default: Date.now },
    usedAt: { type: Date },
  },
  { timestamps: true },
);

ticketSchema.index({ ownerUserId: 1, createdAt: -1 });
ticketSchema.index({ eventId: 1, status: 1 });

export type ITicket = InferSchemaType<typeof ticketSchema> & { _id: Types.ObjectId };

export const TicketModel = model<ITicket>("Ticket", ticketSchema);
