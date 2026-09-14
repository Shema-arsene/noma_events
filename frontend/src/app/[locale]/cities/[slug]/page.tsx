import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GABON_CITIES, type EventDTO } from "@/types";
import { apiGet } from "@/lib/api";
import { EventCard } from "@/components/EventCard";
import { EmptyState } from "@/components/ui/States";
import { Link } from "@/i18n/navigation";

function cityName(slug: string): string {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function resolveCity(slug: string): string | null {
  const name = cityName(slug);
  return GABON_CITIES.find((c) => c.toLowerCase() === name.toLowerCase()) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const name = cityName(slug);
  const t = await getTranslations({ locale, namespace: "cityPage" });
  return {
    title: t("metaTitle", { name }),
    description: t("metaDescription", { name }),
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("cityPage");
  const name = resolveCity(slug);
  if (!name) notFound();
  const { data: events } = await apiGet<EventDTO[]>(`/events?city=${encodeURIComponent(name)}&limit=24&sort=date`, {
    auth: false,
  }).catch(() => ({ data: [] as EventDTO[] }));

  return (
    <div className="container-page py-8">
      <h1 className="font-display text-3xl font-bold text-ink">{t("headline", { name })}</h1>
      <p className="mt-1 text-ink/60">{t("subheadline", { name })}</p>
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
        <Link href={`/events?city=${encodeURIComponent(name)}`} className="focus-ring text-sm font-medium text-teal hover:underline">
          {t("refineSearch")}
        </Link>
      </div>
    </div>
  );
}
