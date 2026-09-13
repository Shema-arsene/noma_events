import argon2 from "argon2";
import { nanoid } from "nanoid";
import { UserRole } from "../../types";
import type { RegisterInput, LoginInput } from "../../validation";
import { UserModel, type UserDocument } from "../users/user.model";
import { ConflictError, UnauthorizedError } from "../../common/errors";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type AccessTokenPayload,
} from "../../common/tokens";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

function issueTokens(user: UserDocument): AuthTokens {
  const payload: AccessTokenPayload = {
    sub: user._id.toString(),
    role: user.role as UserRole,
    tokenVersion: user.tokenVersion,
  };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({
    sub: user._id.toString(),
    tokenVersion: user.tokenVersion,
    jti: nanoid(16),
  });
  return { accessToken, refreshToken };
}

export async function registerUser(input: RegisterInput): Promise<{ user: UserDocument; tokens: AuthTokens }> {
  const existing = await UserModel.findOne({ email: input.email });
  if (existing) {
    throw new ConflictError("Un compte existe déjà avec cette adresse e-mail");
  }

  const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
  const user = await UserModel.create({
    name: input.name,
    email: input.email,
    phone: input.phone || undefined,
    passwordHash,
    role: UserRole.ATTENDEE,
  });

  const tokens = issueTokens(user);
  return { user, tokens };
}

export async function loginUser(input: LoginInput): Promise<{ user: UserDocument; tokens: AuthTokens }> {
  const user = await UserModel.findOne({ email: input.email }).select("+passwordHash");
  if (!user) {
    throw new UnauthorizedError("Identifiants invalides");
  }

  const valid = await argon2.verify(user.passwordHash, input.password);
  if (!valid) {
    throw new UnauthorizedError("Identifiants invalides");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = issueTokens(user);
  return { user, tokens };
}

export async function refreshTokens(refreshToken: string): Promise<{ user: UserDocument; tokens: AuthTokens }> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError("Session expirée, veuillez vous reconnecter");
  }

  const user = await UserModel.findById(payload.sub);
  if (!user || user.tokenVersion !== payload.tokenVersion) {
    throw new UnauthorizedError("Session expirée, veuillez vous reconnecter");
  }

  const tokens = issueTokens(user);
  return { user, tokens };
}

export async function revokeAllSessions(user: UserDocument): Promise<void> {
  user.tokenVersion += 1;
  await user.save();
}
