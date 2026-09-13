"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRole, type EventDTO } from "@/types";
import { RequireAuth } from "@/components/RequireAuth";
import { OrganizerNav, EventTabs } from "@/components/organizer/OrganizerNav";
import { ImageUploadField } from "@/components/organizer/ImageUploadField";
import { apiGet, apiPatch, apiPost, ApiRequestError } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, ErrorState } from "@/components/ui/States";

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function EditEventForm({ event, onSaved }: { event: EventDTO; onSaved: () => void }) {
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
      setError(err instanceof ApiRequestError ? err.message : "Erreur lors de l'enregistrement");
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
      setActionError(err instanceof ApiRequestError ? err.message : "Erreur lors de la publication");
    } finally {
      setPublishing(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Annuler cet événement ? Cette action est irréversible.")) return;
    setPublishing(true);
    setActionError(null);
    try {
      await apiPost(`/organizers/events/${event.id}/cancel`);
      await queryClient.invalidateQueries({ queryKey: ["organizer-event", event.id] });
      router.push("/organizer/events");
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : "Erreur lors de l'annulation");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink">Détails de l&apos;événement</h2>
          <div className="flex gap-2">
            {event.status === "DRAFT" && (
              <Button size="sm" loading={publishing} onClick={handlePublish}>
                Publier
              </Button>
            )}
            {(event.status === "DRAFT" || event.status === "PUBLISHED") && (
              <Button size="sm" variant="danger" loading={publishing} onClick={handleCancel}>
                Annuler l&apos;événement
              </Button>
            )}
          </div>
        </div>
        {actionError && <p className="text-sm text-red-600">{actionError}</p>}

        <div>
          <Label htmlFor="title">Titre</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={event.status !== "DRAFT"} />
        </div>
        <div>
          <Label htmlFor="summary">Résumé</Label>
          <Input id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} disabled={event.status !== "DRAFT"} />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} disabled={event.status !== "DRAFT"} />
        </div>
        {event.status === "DRAFT" && <ImageUploadField label="Image de couverture" value={coverImage} onChange={setCoverImage} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="startAt">Début</Label>
            <Input id="startAt" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} disabled={event.status !== "DRAFT"} />
          </div>
          <div>
            <Label htmlFor="endAt">Fin</Label>
            <Input id="endAt" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} disabled={event.status !== "DRAFT"} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {event.status === "DRAFT" && (
          <Button loading={saving} onClick={handleSave}>
            Enregistrer les modifications
          </Button>
        )}
        {event.status !== "DRAFT" && (
          <p className="text-xs text-ink/50">
            Cet événement est {event.status === "PUBLISHED" ? "publié" : "clôturé"}. Seuls les brouillons peuvent être modifiés.
          </p>
        )}
      </CardBody>
    </Card>
  );
}

function EventDetailInner() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading, isError, refetch } = useQuery({
    queryKey: ["organizer-event", id],
    queryFn: async () => (await apiGet<EventDTO>(`/organizers/events/${id}`)).data,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !event) return <ErrorState message="Événement introuvable." onRetry={() => refetch()} />;

  return (
    <div>
      <OrganizerNav />
      <div className="container-page py-8">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-ink">{event.title}</h1>
          <Badge tone={event.status === "PUBLISHED" ? "success" : event.status === "CANCELLED" ? "danger" : "neutral"}>
            {event.status}
          </Badge>
        </div>
        <EventTabs eventId={event.id} />
        <div className="mt-6 max-w-2xl">
          <EditEventForm event={event} onSaved={() => refetch()} />
        </div>
      </div>
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
