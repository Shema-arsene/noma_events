import type { CategoryInput } from "../../validation";
import { CategoryModel } from "./category.model";
import { uniqueSlug } from "../../common/slug";
import { NotFoundError } from "../../common/errors";

export async function listCategories(activeOnly = true) {
  const filter = activeOnly ? { active: true } : {};
  return CategoryModel.find(filter).sort({ name: 1 });
}

export async function createCategory(input: CategoryInput) {
  const slug = await uniqueSlug(input.name, async (candidate) => {
    const found = await CategoryModel.exists({ slug: candidate });
    return Boolean(found);
  });
  return CategoryModel.create({ ...input, slug });
}

export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  const category = await CategoryModel.findByIdAndUpdate(id, input, { returnDocument: "after" });
  if (!category) throw new NotFoundError("Catégorie introuvable");
  return category;
}

export async function getCategoryBySlug(slug: string) {
  const category = await CategoryModel.findOne({ slug, active: true });
  if (!category) throw new NotFoundError("Catégorie introuvable");
  return category;
}
