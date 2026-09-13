import { Schema, model, Types, type InferSchemaType } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, trim: true, maxlength: 500 },
    imageUrl: { type: String },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export type ICategory = InferSchemaType<typeof categorySchema> & { _id: Types.ObjectId };

export const CategoryModel = model<ICategory>("Category", categorySchema);
