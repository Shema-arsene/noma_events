import Link from "next/link";
import type { CategoryDTO, EventDTO } from "@/types";
import { apiGet } from "@/lib/api";
import { EventCard } from "@/components/EventCard";
import { EmptyState } from "@/components/ui/States";
import { HomeSearch } from "@/components/HomeSearch";

const QUICK_FILTERS = [
  { label: "Aujourd'hui", href: "/events?when=today" },
  { label: "Ce week-end", href: "/events?when=weekend" },
  { label: "Ce mois-ci", href: "/events?when=month" },
  { label: "Gratuit", href: "/events?free=true" },
];

async function getHomeData() {
  const [eventsRes, categoriesRes] = await Promise.all([
    apiGet<EventDTO[]>("/events?limit=12&sort=date", { auth: false }).catch(() => ({ data: [] as EventDTO[] })),
    apiGet<CategoryDTO[]>("/categories", { auth: false }).catch(() => ({ data: [] as CategoryDTO[] })),
  ]);
  return { events: eventsRes.data, categories: categoriesRes.data };
}

export default async function HomePage() {
  const { events, categories } = await getHomeData();
  const featured = events.slice(0, 8);
  const organizers = dedupeOrganizers(events).slice(0, 6);

  return (
    <div>
      <section className="relative overflow-hidden bg-ink text-ivory">
        <div className="container-page relative z-10 py-16 sm:py-24">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gold">Gabon · Libreville et au-delà</p>
          <h1 className="max-w-2xl font-display text-4xl font-bold leading-tight sm:text-5xl">
            Que se passe-t-il <span className="text-gold">au Gabon</span> ?
          </h1>
          <p className="mt-4 max-w-xl text-ivory/70">
            Découvrez des concerts, festivals, expériences culturelles et bien plus. Réservez vos billets en quelques secondes.
          </p>
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
          <h2 className="font-display text-2xl font-bold text-ink">Événements à la une</h2>
          <Link href="/events" className="focus-ring text-sm font-medium text-teal hover:underline">
            Voir tout
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
            <h2 className="mb-6 font-display text-2xl font-bold text-ink">Explorer par catégorie</h2>
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
          <h2 className="mb-6 font-display text-2xl font-bold text-ink">Organisateurs à suivre</h2>
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

      <section className="bg-gradient-to-br from-ink to-black py-16 text-ivory">
        <div className="container-page text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Culture, musique et patrimoine gabonais à l&apos;honneur
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ivory/70">
            De la musique afro-urbaine aux festivals culturels, découvrez la richesse des événements gabonais.
          </p>
          <Link
            href="/categories/culture-patrimoine"
            className="focus-ring mt-6 inline-flex items-center rounded-xl bg-gold px-6 py-3 font-medium text-ink hover:bg-gold-dark"
          >
            Explorer la culture
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
