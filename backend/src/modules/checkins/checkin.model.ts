import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { CheckInResult } from "../../types";

const checkinSchema = new Schema(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", index: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    staffUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    result: { type: String, enum: Object.values(CheckInResult), required: true },
    scannedAt: { type: Date, default: Date.now },
    deviceReference: { type: String },
  },
  { timestamps: true },
);

checkinSchema.index({ eventId: 1, scannedAt: -1 });

export type ICheckIn = InferSchemaType<typeof checkinSchema> & { _id: Types.ObjectId };

export const CheckInModel = model<ICheckIn>("CheckIn", checkinSchema);
