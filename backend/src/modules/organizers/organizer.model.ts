import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { OrganizerVerificationStatus } from "../../types";

const organizerSchema = new Schema(
  {
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, trim: true, maxlength: 4000 },
    logoUrl: { type: String },
    coverUrl: { type: String },
    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true },
    verificationStatus: {
      type: String,
      enum: Object.values(OrganizerVerificationStatus),
      default: OrganizerVerificationStatus.PENDING,
      index: true,
    },
    verificationReason: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

export type IOrganizer = InferSchemaType<typeof organizerSchema> & { _id: Types.ObjectId };

export const OrganizerModel = model<IOrganizer>("Organizer", organizerSchema);
