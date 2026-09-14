"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Ticket, Users, BarChart3 } from "lucide-react";
import type { EventDTO } from "@/types";
import { UserRole } from "@/types";
import { RequireAuth } from "@/components/RequireAuth";
import { useMyOrganizer } from "@/lib/useMyOrganizer";
import { apiGet, apiPost, ApiRequestError } from "@/lib/api";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { formatDateTime, formatXaf } from "@/lib/format";
import { Link } from "@/i18n/navigation";

const STATUS_TONE: Record<EventDTO["status"], "neutral" | "success" | "danger" | "warning"> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  CANCELLED: "danger",
  COMPLETED: "neutral",
  ARCHIVED: "neutral",
};

function EventsList({ organizerId }: { organizerId: string }) {
  const t = useTranslations("organizerEvents");
  const tStatus = useTranslations("eventStatus");
  const queryClient = useQueryClient();
  const confirm = useConfirm();
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
      setActionError(err instanceof ApiRequestError ? err.message : t("publishError"));
    } finally {
      setPendingId(null);
    }
  }

  async function handleCancel(id: string) {
    const ok = await confirm({
      title: t("cancelConfirmTitle"),
      description: t("cancelConfirmDescription"),
      confirmLabel: t("cancelConfirmButton"),
      tone: "danger",
    });
    if (!ok) return;
    setPendingId(id);
    setActionError(null);
    try {
      await apiPost(`/organizers/events/${id}/cancel`);
      await queryClient.invalidateQueries({ queryKey: ["organizer-events", organizerId] });
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : t("cancelError"));
    } finally {
      setPendingId(null);
    }
  }

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={t("loadError")} onRetry={() => refetch()} />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={t("noEventsYet")}
        action={
          <Link href="/organizer/events/new" className="focus-ring flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white">
            <Plus className="h-4 w-4" /> {t("createFirstEvent")}
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {actionError && <p className="text-sm text-danger">{actionError}</p>}
      {data.map((event) => (
        <div key={event.id} className="flex flex-col gap-3 rounded-card border border-ink/10 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Link href={`/organizer/events/${event.id}`} className="focus-ring font-semibold text-ink hover:underline">
                {event.title}
              </Link>
              <Badge tone={STATUS_TONE[event.status]}>{tStatus(event.status)}</Badge>
            </div>
            <p className="mt-1 text-xs text-ink/50">
              {formatDateTime(event.startAt)} · {event.city} ·{" "}
              {event.isFree ? t("free") : event.minPriceXaf !== null ? t("fromPrice", { price: formatXaf(event.minPriceXaf) }) : "—"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/organizer/events/${event.id}/tickets`} className="focus-ring flex items-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-medium hover:bg-sand">
              <Ticket className="h-3.5 w-3.5" /> {t("tickets")}
            </Link>
            <Link href={`/organizer/events/${event.id}/attendees`} className="focus-ring flex items-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-medium hover:bg-sand">
              <Users className="h-3.5 w-3.5" /> {t("attendees")}
            </Link>
            <Link href={`/organizer/events/${event.id}/analytics`} className="focus-ring flex items-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-medium hover:bg-sand">
              <BarChart3 className="h-3.5 w-3.5" /> {t("analytics")}
            </Link>
            {event.status === "DRAFT" && (
              <Button size="sm" loading={pendingId === event.id} onClick={() => handlePublish(event.id)}>
                {t("publish")}
              </Button>
            )}
            {(event.status === "DRAFT" || event.status === "PUBLISHED") && (
              <Button size="sm" variant="danger" loading={pendingId === event.id} onClick={() => handleCancel(event.id)}>
                {t("cancel")}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function OrganizerEventsPage() {
  const t = useTranslations("organizerEvents");
  const { data: organizer, isLoading } = useMyOrganizer();

  if (isLoading) return <LoadingState />;
  if (!organizer) {
    return (
      <EmptyState
        title={t("createProfileFirst")}
        action={
          <Link href="/organizer" className="focus-ring rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white">
            {t("createProfile")}
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">{t("title")}</h1>
      <div className="mt-6">
        <EventsList organizerId={organizer.id} />
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
