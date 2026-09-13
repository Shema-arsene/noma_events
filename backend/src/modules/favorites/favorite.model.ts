import { Schema, model, Types, type InferSchemaType } from "mongoose";

const favoriteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
  },
  { timestamps: true },
);

favoriteSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export type IFavorite = InferSchemaType<typeof favoriteSchema> & { _id: Types.ObjectId };

export const FavoriteModel = model<IFavorite>("Favorite", favoriteSchema);
