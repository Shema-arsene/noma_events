import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { EventDTO } from "@/types";
import { apiGet, ApiRequestError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { EventPurchasePanel } from "@/components/EventPurchasePanel";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ShareButton } from "@/components/ShareButton";

async function getEvent(slug: string): Promise<EventDTO | null> {
  try {
    const { data } = await apiGet<EventDTO>(`/events/${slug}`, { auth: false });
    return data;
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return { title: "Événement introuvable" };
  return {
    title: event.title,
    description: event.summary,
    openGraph: {
      title: event.title,
      description: event.summary,
      images: event.coverImage ? [{ url: event.coverImage }] : undefined,
      type: "website",
    },
    alternates: { canonical: `/events/${event.slug}` },
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.startAt,
    endDate: event.endAt,
    eventStatus:
      event.status === "CANCELLED" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    location: event.venue
      ? {
          "@type": "Place",
          name: event.venue.name,
          address: { "@type": "PostalAddress", streetAddress: event.venue.address, addressLocality: event.venue.city, addressCountry: "GA" },
        }
      : undefined,
    image: event.coverImage ? [event.coverImage] : undefined,
    description: event.summary,
    offers:
      event.ticketTypes?.map((tt) => ({
        "@type": "Offer",
        price: tt.priceXaf,
        priceCurrency: "XAF",
        availability: tt.remaining > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
        url: `https://noma.events/events/${event.slug}`,
      })) ?? [],
    organizer: { "@type": "Organization", name: event.organizer.name },
  };

  return (
    <div className="pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="relative aspect-[16/9] w-full bg-sand sm:aspect-[21/9]">
        {event.coverImage && (
          <Image src={event.coverImage} alt={event.title} fill priority className="object-cover" sizes="100vw" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      </div>

      <div className="container-page -mt-16 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-card bg-white p-6 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              {event.category && <Badge tone="teal">{event.category.name}</Badge>}
              {event.status === "CANCELLED" && <Badge tone="danger">Événement annulé</Badge>}
              {event.status === "COMPLETED" && <Badge tone="neutral">Événement terminé</Badge>}
              <span className="ml-auto flex gap-2">
                <FavoriteButton eventId={event.id} />
                <ShareButton title={event.title} />
              </span>
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold text-ink">{event.title}</h1>
            <p className="mt-2 text-ink/60">
              Par{" "}
              <Link href={`/organizers/${event.organizer.slug}`} className="font-medium text-teal hover:underline">
                {event.organizer.name}
              </Link>
            </p>

            <dl className="mt-6 grid gap-4 border-t border-ink/10 pt-6 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase text-ink/40">Date &amp; heure</dt>
                <dd className="mt-1 text-sm font-medium text-ink">{formatDateTime(event.startAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-ink/40">Lieu</dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {event.venue?.name}
                  {event.venue?.address ? `, ${event.venue.address}` : ""}, {event.city}
                </dd>
              </div>
            </dl>

            <div className="mt-6 border-t border-ink/10 pt-6">
              <h2 className="font-display text-lg font-semibold text-ink">À propos de l&apos;événement</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/70">{event.description}</p>
            </div>

            <div className="mt-6 rounded-xl bg-ivory p-4 text-sm text-ink/60">
              Les billets ne sont ni remboursables ni échangeables, sauf en cas d&apos;annulation de l&apos;événement par
              l&apos;organisateur. En cas d&apos;annulation, vos billets sont automatiquement invalidés et vous serez notifié.
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <EventPurchasePanel event={event} />
        </div>
      </div>
    </div>
  );
}
