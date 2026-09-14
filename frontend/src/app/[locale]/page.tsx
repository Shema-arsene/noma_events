import { getTranslations, setRequestLocale } from "next-intl/server";
import type { CategoryDTO, EventDTO } from "@/types";
import { apiGet } from "@/lib/api";
import { EventCard } from "@/components/EventCard";
import { EmptyState } from "@/components/ui/States";
import { HomeSearch } from "@/components/HomeSearch";
import { Link } from "@/i18n/navigation";

async function getHomeData() {
  const [eventsRes, categoriesRes] = await Promise.all([
    apiGet<EventDTO[]>("/events?limit=12&sort=date", { auth: false }).catch(() => ({ data: [] as EventDTO[] })),
    apiGet<CategoryDTO[]>("/categories", { auth: false }).catch(() => ({ data: [] as CategoryDTO[] })),
  ]);
  return { events: eventsRes.data, categories: categoriesRes.data };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const { events, categories } = await getHomeData();
  const featured = events.slice(0, 8);
  const organizers = dedupeOrganizers(events).slice(0, 6);

  const QUICK_FILTERS = [
    { label: t("today"), href: "/events?when=today" },
    { label: t("thisWeekend"), href: "/events?when=weekend" },
    { label: t("thisMonth"), href: "/events?when=month" },
    { label: t("free"), href: "/events?free=true" },
  ];

  return (
    <div>
      <section className="relative overflow-hidden bg-ink text-ivory">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border border-gold/15" />
        <div className="absolute -right-4 top-24 h-32 w-32 rounded-full border border-gold/10" />
        <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-teal/15 blur-3xl" />
        <div className="container-page relative z-10 py-16 sm:py-24">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gold">{t("eyebrow")}</p>
          <h1 className="max-w-2xl font-display text-4xl font-bold leading-tight sm:text-5xl">
            {t.rich("headline", { gold: (chunks) => <span className="text-gold">{chunks}</span> })}
          </h1>
          <p className="mt-4 max-w-xl text-ivory/70">{t("subheadline")}</p>
          <div className="mt-8 max-w-xl">
            <HomeSearch />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {QUICK_FILTERS.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className="focus-ring rounded-full border border-ivory/20 bg-white/5 px-4 py-2 text-sm font-medium text-ivory hover:bg-white/10"
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold text-ink">{t("featuredEvents")}</h2>
          <Link href="/events" className="focus-ring text-sm font-medium text-teal hover:underline">
            {t("seeAll")}
          </Link>
        </div>
        {featured.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {categories.length > 0 && (
        <section className="bg-white py-12">
          <div className="container-page">
            <h2 className="mb-6 font-display text-2xl font-bold text-ink">{t("exploreByCategory")}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="focus-ring flex items-center justify-center rounded-xl border border-ink/10 bg-ivory px-4 py-6 text-center text-sm font-semibold text-ink transition-colors hover:border-gold hover:bg-gold/10"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {organizers.length > 0 && (
        <section className="container-page py-12">
          <h2 className="mb-6 font-display text-2xl font-bold text-ink">{t("organizersToFollow")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {organizers.map((org) => (
              <Link
                key={org.id}
                href={`/organizers/${org.slug}`}
                className="focus-ring flex flex-col items-center gap-2 rounded-xl border border-ink/10 bg-white p-4 text-center hover:border-teal"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sand text-lg font-bold text-ink">
                  {org.name.charAt(0)}
                </span>
                <span className="line-clamp-1 text-sm font-medium text-ink">{org.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="relative overflow-hidden bg-ink py-16 text-ivory">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border border-gold/15" />
        <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-teal/15 blur-3xl" />
        <div className="container-page relative z-10 text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">{t("cultureHeading")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-ivory/70">{t("cultureSubheading")}</p>
          <Link
            href="/categories/culture-patrimoine"
            className="focus-ring mt-6 inline-flex items-center rounded-xl bg-gold px-6 py-3 font-medium text-ink hover:bg-gold-dark"
          >
            {t("exploreCulture")}
          </Link>
        </div>
      </section>
    </div>
  );
}

function dedupeOrganizers(events: EventDTO[]) {
  const seen = new Map<string, EventDTO["organizer"]>();
  for (const event of events) {
    if (!seen.has(event.organizer.id)) seen.set(event.organizer.id, event.organizer);
  }
  return Array.from(seen.values());
}
