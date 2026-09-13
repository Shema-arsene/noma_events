import { Router } from "express";
import { registerSchema, loginSchema, refreshTokenSchema } from "../../validation";
import { validate } from "../../middleware/validate";
import { authRateLimiter } from "../../middleware/rateLimit";
import * as authController from "./auth.controller";

const router = Router();

router.post("/register", authRateLimiter, validate(registerSchema), authController.register);
router.post("/login", authRateLimiter, validate(loginSchema), authController.login);
router.post("/refresh", authRateLimiter, validate(refreshTokenSchema), authController.refresh);
router.post("/logout", authController.logout);

export default router;
