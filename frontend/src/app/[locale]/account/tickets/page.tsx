"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import type { TicketDTO } from "@/types";
import { apiGet } from "@/lib/api";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/format";
import { Link } from "@/i18n/navigation";

const STATUS_TONE: Record<TicketDTO["status"], "success" | "neutral" | "danger" | "warning"> = {
  ACTIVE: "success",
  USED: "neutral",
  CANCELLED: "danger",
  REFUNDED: "warning",
};

function TicketsList() {
  const t = useTranslations("account");
  const tStatus = useTranslations("ticketStatus");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-tickets"],
    queryFn: async () => (await apiGet<TicketDTO[]>("/me/tickets")).data,
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={t("ticketsLoadError")} onRetry={() => refetch()} />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={t("noTicketsYet")}
        action={
          <Link href="/events" className="focus-ring rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white">
            {t("discoverEvents")}
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((ticket) => (
        <Link
          key={ticket.id}
          href={`/tickets/${ticket.id}`}
          className="focus-ring flex overflow-hidden rounded-card border border-ink/10 bg-white shadow-card"
        >
          <div className="relative w-28 shrink-0 bg-sand">
            {ticket.event.coverImage && (
              <Image src={ticket.event.coverImage} alt={ticket.event.title} fill className="object-cover" />
            )}
          </div>
          <div className="flex flex-1 flex-col gap-1 p-4">
            <Badge tone={STATUS_TONE[ticket.status]} className="w-fit">
              {tStatus(ticket.status)}
            </Badge>
            <p className="line-clamp-1 text-sm font-semibold text-ink">{ticket.event.title}</p>
            <p className="text-xs text-ink/60">{formatDateTime(ticket.event.startAt)}</p>
            <p className="text-xs text-ink/50">{ticket.ticketTypeName} · {ticket.displayCode}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function TicketsPage() {
  const t = useTranslations("account");
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">{t("myTickets")}</h1>
      <div className="mt-6">
        <TicketsList />
      </div>
    </div>
  );
}
