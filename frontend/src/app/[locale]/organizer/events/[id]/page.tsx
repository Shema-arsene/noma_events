"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { UserRole, type EventDTO } from "@/types";
import { RequireAuth } from "@/components/RequireAuth";
import { ImageUploadField } from "@/components/organizer/ImageUploadField";
import { apiGet, apiPatch, apiPost, ApiRequestError } from "@/lib/api";
import { useRouter } from "@/i18n/navigation";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { useConfirm } from "@/components/ui/ConfirmDialog";

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function EditEventForm({ event, onSaved }: { event: EventDTO; onSaved: () => void }) {
  const t = useTranslations("editEvent");
  const confirm = useConfirm();
  const [title, setTitle] = useState(event.title);
  const [summary, setSummary] = useState(event.summary);
  const [description, setDescription] = useState(event.description);
  const [coverImage, setCoverImage] = useState(event.coverImage ?? "");
  const [startAt, setStartAt] = useState(toLocalInput(event.startAt));
  const [endAt, setEndAt] = useState(toLocalInput(event.endAt));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await apiPatch(`/organizers/events/${event.id}`, { title, summary, description, coverImage, startAt, endAt });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setActionError(null);
    try {
      await apiPost(`/organizers/events/${event.id}/publish`);
      onSaved();
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : t("publishError"));
    } finally {
      setPublishing(false);
    }
  }

  async function handleCancel() {
    const ok = await confirm({
      title: t("cancelConfirmTitle"),
      description: t("cancelConfirmDescription"),
      confirmLabel: t("cancelConfirmButton"),
      tone: "danger",
    });
    if (!ok) return;
    setPublishing(true);
    setActionError(null);
    try {
      await apiPost(`/organizers/events/${event.id}/cancel`);
      await queryClient.invalidateQueries({ queryKey: ["organizer-event", event.id] });
      router.push("/organizer/events");
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : t("cancelError"));
    } finally {
      setPublishing(false);
    }
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink">{t("eventDetails")}</h2>
          <div className="flex gap-2">
            {event.status === "DRAFT" && (
              <Button size="sm" loading={publishing} onClick={handlePublish}>
                {t("publish")}
              </Button>
            )}
            {(event.status === "DRAFT" || event.status === "PUBLISHED") && (
              <Button size="sm" variant="danger" loading={publishing} onClick={handleCancel}>
                {t("cancelEvent")}
              </Button>
            )}
          </div>
        </div>
        {actionError && <p className="text-sm text-danger">{actionError}</p>}

        {event.status !== "DRAFT" && (
          <div className="flex items-center gap-2.5 rounded-xl border border-ink/10 bg-ivory px-4 py-3 text-sm text-ink/60">
            <Lock className="h-4 w-4 shrink-0" />
            {event.status === "PUBLISHED" ? t("lockedPublished") : t("lockedClosed")}
          </div>
        )}

        <div>
          <Label htmlFor="title">{t("titleLabel")}</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={event.status !== "DRAFT"} />
        </div>
        <div>
          <Label htmlFor="summary">{t("summaryLabel")}</Label>
          <Input id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} disabled={event.status !== "DRAFT"} />
        </div>
        <div>
          <Label htmlFor="description">{t("descriptionLabel")}</Label>
          <Textarea id="description" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} disabled={event.status !== "DRAFT"} />
        </div>
        {event.status === "DRAFT" && <ImageUploadField label={t("coverImageLabel")} value={coverImage} onChange={setCoverImage} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="startAt">{t("startLabel")}</Label>
            <Input id="startAt" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} disabled={event.status !== "DRAFT"} />
          </div>
          <div>
            <Label htmlFor="endAt">{t("endLabel")}</Label>
            <Input id="endAt" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} disabled={event.status !== "DRAFT"} />
          </div>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        {event.status === "DRAFT" && (
          <Button loading={saving} onClick={handleSave}>
            {t("saveChanges")}
          </Button>
        )}
      </CardBody>
    </Card>
  );
}

function EventDetailInner() {
  const t = useTranslations("editEvent");
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading, isError, refetch } = useQuery({
    queryKey: ["organizer-event", id],
    queryFn: async () => (await apiGet<EventDTO>(`/organizers/events/${id}`)).data,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !event) return <ErrorState message={t("eventNotFound")} onRetry={() => refetch()} />;

  return (
    <div className="max-w-2xl">
      <EditEventForm event={event} onSaved={() => refetch()} />
    </div>
  );
}

export default function EventDetailPage() {
  return (
    <RequireAuth roles={[UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <EventDetailInner />
    </RequireAuth>
  );
}
