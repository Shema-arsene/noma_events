"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { EventDTO } from "@/types";
import { UserRole } from "@/types";
import { RequireAuth } from "@/components/RequireAuth";
import { OrganizerNav } from "@/components/organizer/OrganizerNav";
import { useMyOrganizer } from "@/lib/useMyOrganizer";
import { apiGet, apiPost, ApiRequestError } from "@/lib/api";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateTime, formatXaf } from "@/lib/format";

const STATUS_TONE: Record<EventDTO["status"], "neutral" | "success" | "danger" | "warning"> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  CANCELLED: "danger",
  COMPLETED: "neutral",
  ARCHIVED: "neutral",
};
const STATUS_LABEL: Record<EventDTO["status"], string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  CANCELLED: "Annulé",
  COMPLETED: "Terminé",
  ARCHIVED: "Archivé",
};

function EventsList({ organizerId }: { organizerId: string }) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["organizer-events", organizerId],
    queryFn: async () => (await apiGet<EventDTO[]>(`/organizers/events?organizerId=${organizerId}`)).data,
  });

  async function handlePublish(id: string) {
    setPendingId(id);
    setActionError(null);
    try {
      await apiPost(`/organizers/events/${id}/publish`);
      await queryClient.invalidateQueries({ queryKey: ["organizer-events", organizerId] });
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : "Erreur lors de la publication");
    } finally {
      setPendingId(null);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Annuler cet événement ? Les billets déjà vendus seront invalidés.")) return;
    setPendingId(id);
    setActionError(null);
    try {
      await apiPost(`/organizers/events/${id}/cancel`);
      await queryClient.invalidateQueries({ queryKey: ["organizer-events", organizerId] });
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : "Erreur lors de l'annulation");
    } finally {
      setPendingId(null);
    }
  }

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Impossible de charger vos événements." onRetry={() => refetch()} />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Aucun événement pour le moment."
        action={
          <Link href="/organizer/events/new" className="focus-ring rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white">
            Créer mon premier événement
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {actionError && <p className="text-sm text-red-600">{actionError}</p>}
      {data.map((event) => (
        <div key={event.id} className="flex flex-col gap-3 rounded-card border border-ink/10 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Link href={`/organizer/events/${event.id}`} className="focus-ring font-semibold text-ink hover:underline">
                {event.title}
              </Link>
              <Badge tone={STATUS_TONE[event.status]}>{STATUS_LABEL[event.status]}</Badge>
            </div>
            <p className="mt-1 text-xs text-ink/50">
              {formatDateTime(event.startAt)} · {event.city} ·{" "}
              {event.isFree ? "Gratuit" : event.minPriceXaf !== null ? `Dès ${formatXaf(event.minPriceXaf)}` : "—"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/organizer/events/${event.id}/tickets`} className="focus-ring rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-medium hover:bg-sand">
              Billets
            </Link>
            <Link href={`/organizer/events/${event.id}/attendees`} className="focus-ring rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-medium hover:bg-sand">
              Participants
            </Link>
            <Link href={`/organizer/events/${event.id}/analytics`} className="focus-ring rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-medium hover:bg-sand">
              Analytique
            </Link>
            {event.status === "DRAFT" && (
              <Button size="sm" loading={pendingId === event.id} onClick={() => handlePublish(event.id)}>
                Publier
              </Button>
            )}
            {(event.status === "DRAFT" || event.status === "PUBLISHED") && (
              <Button size="sm" variant="danger" loading={pendingId === event.id} onClick={() => handleCancel(event.id)}>
                Annuler
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function OrganizerEventsPage() {
  const { data: organizer, isLoading } = useMyOrganizer();

  if (isLoading) return <LoadingState />;
  if (!organizer) {
    return <EmptyState title="Créez d'abord votre profil organisateur." action={<Link href="/organizer" className="focus-ring rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white">Créer mon profil</Link>} />;
  }

  return (
    <div>
      <OrganizerNav />
      <div className="container-page py-8">
        <h1 className="font-display text-2xl font-bold text-ink">Mes événements</h1>
        <div className="mt-6">
          <EventsList organizerId={organizer.id} />
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <RequireAuth roles={[UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <OrganizerEventsPage />
    </RequireAuth>
  );
}
