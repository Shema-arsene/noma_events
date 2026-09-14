import Image from "next/image";
import { useTranslations } from "next-intl";
import { Ticket } from "lucide-react";
import type { EventDTO } from "@/types";
import { formatDateShort, formatXaf } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Link } from "@/i18n/navigation";

export function EventCard({ event }: { event: EventDTO }) {
  const t = useTranslations("eventCard");
  return (
    <Link
      href={`/events/${event.slug}`}
      className="focus-ring group flex flex-col overflow-hidden rounded-card border border-ink/10 bg-white shadow-card transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand">
        {event.coverImage ? (
          <Image
            src={event.coverImage}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-ink/25">
            <Ticket className="h-8 w-8" strokeWidth={1.5} />
            <span className="text-xs font-medium">Noma Events</span>
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-lg bg-white/95 px-2.5 py-1.5 text-center leading-none shadow">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-teal">
            {formatDateShort(event.startAt).split(" ")[1]}
          </div>
          <div className="text-lg font-bold text-ink">{formatDateShort(event.startAt).split(" ")[0]}</div>
        </div>
        {event.category && (
          <Badge tone="teal" className="absolute right-3 top-3 bg-white/95">
            {event.category.name}
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 font-display text-base font-semibold text-ink">{event.title}</h3>
        <p className="line-clamp-1 text-sm text-ink/60">
          {event.venue?.name ? `${event.venue.name}, ` : ""}
          {event.city}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-semibold text-gold-dark">
            {event.isFree ? t("free") : event.minPriceXaf !== null ? t("fromPrice", { price: formatXaf(event.minPriceXaf) }) : "—"}
          </span>
          {event.organizer && <span className="line-clamp-1 max-w-[45%] text-xs text-ink/40">{event.organizer.name}</span>}
        </div>
      </div>
    </Link>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-ink/10 bg-white shadow-card">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}
