import type { Metadata } from "next";
import Link from "next/link";
import type { EventDTO } from "@/types";
import { apiGet } from "@/lib/api";
import { EventCard } from "@/components/EventCard";
import { EmptyState } from "@/components/ui/States";

function cityName(slug: string): string {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const name = cityName(slug);
  return {
    title: `Événements à ${name}`,
    description: `Découvrez tous les événements à venir à ${name}, Gabon, sur Noma Events.`,
  };
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = cityName(slug);
  const { data: events } = await apiGet<EventDTO[]>(`/events?city=${encodeURIComponent(name)}&limit=24&sort=date`, {
    auth: false,
  }).catch(() => ({ data: [] as EventDTO[] }));

  return (
    <div className="container-page py-8">
      <h1 className="font-display text-3xl font-bold text-ink">Que se passe-t-il à {name} ?</h1>
      <p className="mt-1 text-ink/60">Tous les événements à venir dans la ville de {name}.</p>
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
          Affiner la recherche →
        </Link>
      </div>
    </div>
  );
}
