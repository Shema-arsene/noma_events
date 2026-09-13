import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { UserRole, UserStatus } from "../../types";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.ATTENDEE, index: true },
    status: { type: String, enum: Object.values(UserStatus), default: UserStatus.ACTIVE, index: true },
    avatarUrl: { type: String },
    locale: { type: String, default: "fr" },
    lastLoginAt: { type: Date },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type IUser = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<IUser>;

export const UserModel = model<IUser>("User", userSchema);
