import type { Request, Response } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { sendSuccess } from "../../common/response";
import { param } from "../../common/params";
import { toCategoryDTO } from "./category.mapper";
import * as categoriesService from "./categories.service";

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const activeOnly = req.query.all !== "true";
  const categories = await categoriesService.listCategories(activeOnly);
  sendSuccess(res, categories.map(toCategoryDTO));
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesService.createCategory(req.body);
  sendSuccess(res, toCategoryDTO(category), 201);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesService.updateCategory(param(req, "id"), req.body);
  sendSuccess(res, toCategoryDTO(category));
});
