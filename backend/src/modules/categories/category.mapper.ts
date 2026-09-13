import type { CategoryDTO } from "../../types";
import type { ICategory } from "./category.model";
import type { HydratedDocument } from "mongoose";

export function toCategoryDTO(category: HydratedDocument<ICategory>): CategoryDTO {
  return {
    id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    description: category.description ?? undefined,
    imageUrl: category.imageUrl ?? undefined,
    active: category.active,
  };
}
