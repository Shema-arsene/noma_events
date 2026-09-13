import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { EventStatus, EventVisibility } from "../../types";

const eventSchema = new Schema(
  {
    organizerId: { type: Schema.Types.ObjectId, ref: "Organizer", required: true, index: true },
    venueId: { type: Schema.Types.ObjectId, ref: "Venue", required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    summary: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, required: true, trim: true, maxlength: 10000 },
    coverImage: { type: String },
    gallery: { type: [String], default: [] },
    city: { type: String, required: true, trim: true, index: true },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true },
    salesStartAt: { type: Date, required: true },
    salesEndAt: { type: Date, required: true },
    status: { type: String, enum: Object.values(EventStatus), default: EventStatus.DRAFT, index: true },
    visibility: {
      type: String,
      enum: Object.values(EventVisibility),
      default: EventVisibility.PUBLIC,
    },
    capacity: { type: Number, min: 1 },
    viewCount: { type: Number, default: 0 },
    publishedAt: { type: Date },
    cancelledAt: { type: Date },
    // Denormalized from TicketType documents whenever ticket types change,
    // so public discovery filters (free/paid, price range) avoid a join.
    minPriceXaf: { type: Number, default: null },
    isFree: { type: Boolean, default: false },
  },
  { timestamps: true },
);

eventSchema.index({ title: "text", summary: "text", city: "text" });
eventSchema.index({ status: 1, startAt: 1 });
eventSchema.index({ status: 1, city: 1, startAt: 1 });
eventSchema.index({ status: 1, categoryId: 1, startAt: 1 });

export type IEvent = InferSchemaType<typeof eventSchema> & { _id: Types.ObjectId };

export const EventModel = model<IEvent>("Event", eventSchema);
