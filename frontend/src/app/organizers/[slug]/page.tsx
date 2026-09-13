import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { EventDTO, OrganizerDTO } from "@/types";
import { apiGet, ApiRequestError } from "@/lib/api";
import { EventCard } from "@/components/EventCard";
import { EmptyState } from "@/components/ui/States";
import { Badge } from "@/components/ui/Badge";

async function getOrganizer(slug: string): Promise<OrganizerDTO | null> {
  try {
    const { data } = await apiGet<OrganizerDTO>(`/organizers/${slug}`, { auth: false });
    return data;
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const organizer = await getOrganizer(slug);
  if (!organizer) return { title: "Organisateur introuvable" };
  return {
    title: organizer.name,
    description: organizer.description ?? `Découvrez les événements organisés par ${organizer.name} sur Noma Events.`,
  };
}

export default async function OrganizerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const organizer = await getOrganizer(slug);
  if (!organizer) notFound();

  const { data: events } = await apiGet<EventDTO[]>(`/events?organizer=${slug}&limit=24&sort=date`, {
    auth: false,
  }).catch(() => ({ data: [] as EventDTO[] }));

  return (
    <div className="pb-16">
      <div className="relative h-48 w-full bg-sand sm:h-64">
        {organizer.coverUrl && <Image src={organizer.coverUrl} alt="" fill className="object-cover" />}
      </div>
      <div className="container-page -mt-12">
        <div className="flex items-end gap-4">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-ivory bg-white shadow-card">
            {organizer.logoUrl ? (
              <Image src={organizer.logoUrl} alt={organizer.name} width={96} height={96} className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-2xl font-bold text-ink">{organizer.name.charAt(0)}</span>
            )}
          </div>
          <div className="pb-2">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-ink">{organizer.name}</h1>
              {organizer.verificationStatus === "VERIFIED" && <Badge tone="teal">Vérifié</Badge>}
            </div>
          </div>
        </div>

        {organizer.description && <p className="mt-4 max-w-2xl text-sm text-ink/70">{organizer.description}</p>}

        <h2 className="mt-10 font-display text-xl font-bold text-ink">Événements</h2>
        <div className="mt-4">
          {events.length === 0 ? (
            <EmptyState description="Cet organisateur n'a pas encore d'événements publiés." />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
