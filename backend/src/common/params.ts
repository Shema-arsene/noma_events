import type { Request } from "express";

/**
 * Express 5's route params are typed `string | string[]` (path-to-regexp v8
 * supports repeated param names). None of this app's routes repeat a param
 * name, so a given param is always a single string at runtime — this just
 * narrows the type at the read site instead of scattering `as string` casts.
 */
export function param(req: Request, name: string): string {
  return req.params[name] as string;
}
