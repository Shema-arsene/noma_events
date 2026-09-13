import { Schema, model, Types, type InferSchemaType } from "mongoose";

const venueSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    address: { type: String, required: true, trim: true, maxlength: 300 },
    city: { type: String, required: true, trim: true, index: true },
    country: { type: String, default: "Gabon", trim: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    capacity: { type: Number, min: 1 },
  },
  { timestamps: true },
);

export type IVenue = InferSchemaType<typeof venueSchema> & { _id: Types.ObjectId };

export const VenueModel = model<IVenue>("Venue", venueSchema);
