import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { CategoryDTO, EventDTO } from "@/types";
import { apiGet } from "@/lib/api";
import { EventCard } from "@/components/EventCard";
import { EmptyState } from "@/components/ui/States";
import { Link } from "@/i18n/navigation";

async function getCategory(slug: string): Promise<CategoryDTO | null> {
  try {
    const { data } = await apiGet<CategoryDTO[]>("/categories?all=true", { auth: false });
    return data.find((c) => c.slug === slug) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await getCategory(slug);
  const name = category?.name ?? slug;
  const t = await getTranslations({ locale, namespace: "categoryPage" });
  return {
    title: t("metaTitle", { name }),
    description: t("metaDescription", { name }),
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("categoryPage");
  const category = await getCategory(slug);
  if (!category) notFound();
  const { data: events } = await apiGet<EventDTO[]>(`/events?category=${slug}&limit=24&sort=date`, {
    auth: false,
  }).catch(() => ({ data: [] as EventDTO[] }));

  return (
    <div className="container-page py-8">
      <h1 className="font-display text-3xl font-bold text-ink">{category.name}</h1>
      {category.description && <p className="mt-1 max-w-2xl text-ink/60">{category.description}</p>}
      <div className="mt-6">
        {events.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
      <div className="mt-8">
        <Link href={`/events?category=${slug}`} className="focus-ring text-sm font-medium text-teal hover:underline">
          {t("refineSearch")}
        </Link>
      </div>
    </div>
  );
}
