import { Router } from "express";
import { UserRole } from "../../types";
import { categorySchema } from "../../validation";
import { validate } from "../../middleware/validate";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as categoriesController from "./categories.controller";

const router = Router();

router.get("/", categoriesController.listCategories);
router.post(
  "/",
  requireAuth(),
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate(categorySchema),
  categoriesController.createCategory,
);
router.patch(
  "/:id",
  requireAuth(),
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate(categorySchema.partial()),
  categoriesController.updateCategory,
);

export default router;
