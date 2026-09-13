import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { ValidationError } from "../common/errors";

type Source = "body" | "query" | "params";

/**
 * Validates req[source] against a Zod schema and replaces it with the parsed
 * (coerced/defaulted) result.
 *
 * Express 5 made `req.query` a getter-only property, so it can no longer be
 * reassigned like `req.body`/`req.params` can. For `source: "query"`, the
 * validated result is stashed on `res.locals.query` instead — read it from
 * there in the controller rather than from `req.query`.
 */
export function validate(schema: ZodTypeAny, source: Source = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(new ValidationError("Données invalides", result.error.flatten()));
      return;
    }
    if (source === "query") {
      res.locals.query = result.data;
    } else {
      (req as unknown as Record<Source, unknown>)[source] = result.data;
    }
    next();
  };
}
