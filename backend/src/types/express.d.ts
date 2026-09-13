import type { HydratedDocument } from "mongoose";
import type { IUser } from "../modules/users/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: HydratedDocument<IUser>;
    }
  }
}

export {};
