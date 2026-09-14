"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban } from "lucide-react";
import { apiGet, apiPost, ApiRequestError } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { formatDateTime } from "@/lib/format";

interface AdminEventRow {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED" | "ARCHIVED";
  city: string;
  startAt: string;
  organizerName?: string;
  categoryName?: string;
}

function EventsList() {
  const t = useTranslations("adminEvents");
  const tStatus = useTranslations("eventStatus");
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => (await apiGet<AdminEventRow[]>("/admin/events?limit=100")).data,
  });

  async function handleCancel(id: string) {
    const ok = await confirm({
      title: t("cancelConfirmTitle"),
      description: t("cancelConfirmDescription"),
      confirmLabel: t("cancelConfirmButton"),
      tone: "danger",
    });
    if (!ok) return;
    setPendingId(id);
    setError(null);
    try {
      await apiPost(`/admin/events/${id}/cancel`);
      await queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("genericError"));
    } finally {
      setPendingId(null);
    }
  }

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState message={t("loadError")} onRetry={() => refetch()} />;
  if (data.length === 0) return <EmptyState title={t("noEvents")} />;

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-danger">{error}</p>}
      {data.map((event) => (
        <div key={event.id} className="flex flex-col gap-2 rounded-card border border-ink/10 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-ink">{event.title}</p>
            <p className="text-xs text-ink/50">
              {event.organizerName} · {event.categoryName} · {event.city} · {formatDateTime(event.startAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={event.status === "PUBLISHED" ? "success" : event.status === "CANCELLED" ? "danger" : "neutral"}>
              {tStatus(event.status)}
            </Badge>
            {(event.status === "PUBLISHED" || event.status === "DRAFT") && (
              <Button size="sm" variant="danger" loading={pendingId === event.id} onClick={() => handleCancel(event.id)}>
                <Ban className="h-3.5 w-3.5" /> {t("cancel")}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminEventsPage() {
  const t = useTranslations("adminEvents");
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">{t("title")}</h1>
      <div className="mt-6">
        <EventsList />
      </div>
    </div>
  );
}
