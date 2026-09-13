import slugify from "slugify";
import { nanoid } from "nanoid";

export function baseSlug(text: string): string {
  return slugify(text, { lower: true, strict: true, trim: true }).slice(0, 100) || nanoid(8);
}

/**
 * Generates a slug guaranteed unique per the given exists-check, appending a
 * short random suffix on collision.
 */
export async function uniqueSlug(
  text: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const candidate = baseSlug(text);
  if (!(await exists(candidate))) return candidate;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffixed = `${candidate}-${nanoid(5).toLowerCase()}`;
    if (!(await exists(suffixed))) return suffixed;
  }
  return `${candidate}-${nanoid(10).toLowerCase()}`;
}
