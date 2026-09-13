import { Schema, model, Types, type InferSchemaType } from "mongoose";

const eventStaffSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    permissions: { type: [String], default: ["SCAN"] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

eventStaffSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export type IEventStaff = InferSchemaType<typeof eventStaffSchema> & { _id: Types.ObjectId };

export const EventStaffModel = model<IEventStaff>("EventStaff", eventStaffSchema);
