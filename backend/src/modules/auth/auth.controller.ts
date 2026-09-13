import type { Request, Response } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { sendSuccess } from "../../common/response";
import { UnauthorizedError } from "../../common/errors";
import { toUserDTO } from "../users/user.mapper";
import type { UserDocument } from "../users/user.model";
import * as authService from "./auth.service";
import type { AuthTokens } from "./auth.service";

function authResponse(user: UserDocument, tokens: AuthTokens) {
  return {
    user: toUserDTO(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, tokens } = await authService.registerUser(req.body);
  sendSuccess(res, authResponse(user, tokens), 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, tokens } = await authService.loginUser(req.body);
  sendSuccess(res, authResponse(user, tokens));
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) throw new UnauthorizedError();

  const { user, tokens } = await authService.refreshTokens(refreshToken);
  sendSuccess(res, authResponse(user, tokens));
});

// Tokens are stateless (no server-side session store), so logout is just an
// acknowledgment — the client is responsible for discarding its stored
// access/refresh tokens. Kept as a real endpoint (rather than handled purely
// client-side) so it stays a natural place to add token revocation later.
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, { loggedOut: true });
});
