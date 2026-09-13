"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRole } from "@/types";
import { RequireAuth } from "@/components/RequireAuth";
import { OrganizerNav, EventTabs } from "@/components/organizer/OrganizerNav";
import { apiGet, apiPost, apiDelete, ApiRequestError } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";

interface Attendee {
  id: string;
  attendeeName: string;
  ticketTypeName: string;
  displayCode: string;
  status: string;
  issuedAt: string;
  usedAt?: string;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  active: boolean;
}

function AttendeesTable({ eventId }: { eventId: string }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["event-attendees", eventId],
    queryFn: async () => (await apiGet<Attendee[]>(`/organizers/events/${eventId}/attendees`)).data,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState message="Erreur de chargement" onRetry={() => refetch()} />;
  if (data.length === 0) return <EmptyState title="Aucun billet vendu pour le moment." />;

  return (
    <div className="overflow-x-auto rounded-card border border-ink/10 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-ivory text-left text-xs uppercase text-ink/50">
          <tr>
            <th className="px-4 py-3">Nom</th>
            <th className="px-4 py-3">Billet</th>
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Statut</th>
          </tr>
        </thead>
        <tbody>
          {data.map((a) => (
            <tr key={a.id} className="border-t border-ink/5">
              <td className="px-4 py-3">{a.attendeeName}</td>
              <td className="px-4 py-3">{a.ticketTypeName}</td>
              <td className="px-4 py-3 font-mono text-xs">{a.displayCode}</td>
              <td className="px-4 py-3">
                <Badge tone={a.status === "USED" ? "success" : a.status === "ACTIVE" ? "teal" : "neutral"}>{a.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StaffManager({ eventId }: { eventId: string }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: staff, isLoading } = useQuery({
    queryKey: ["event-staff", eventId],
    queryFn: async () => (await apiGet<StaffMember[]>(`/organizers/events/${eventId}/staff`)).data,
  });

  async function handleInvite() {
    setInviting(true);
    setError(null);
    try {
      await apiPost(`/organizers/events/${eventId}/staff`, { email, permissions: ["SCAN"] });
      setEmail("");
      await queryClient.invalidateQueries({ queryKey: ["event-staff", eventId] });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Impossible d'ajouter ce membre");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(staffId: string) {
    await apiDelete(`/organizers/events/${eventId}/staff/${staffId}`);
    await queryClient.invalidateQueries({ queryKey: ["event-staff", eventId] });
  }

  return (
    <Card>
      <CardBody className="space-y-3">
        <h2 className="font-semibold text-ink">Personnel de scan</h2>
        <p className="text-sm text-ink/60">
          Ajoutez des membres pour scanner les billets le jour de l&apos;événement. Ils doivent déjà avoir un compte Noma Events.
        </p>
        {isLoading ? (
          <LoadingState />
        ) : (
          <ul className="space-y-2">
            {staff?.filter((s) => s.active).map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg border border-ink/10 px-3 py-2 text-sm">
                <span>
                  {s.name} <span className="text-ink/50">({s.email})</span>
                </span>
                <button onClick={() => handleRemove(s.id)} className="focus-ring text-xs text-red-600 hover:underline">
                  Retirer
                </button>
              </li>
            ))}
            {staff?.filter((s) => s.active).length === 0 && <p className="text-sm text-ink/50">Aucun membre assigné.</p>}
          </ul>
        )}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="staffEmail">E-mail du membre</Label>
            <Input id="staffEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button className="self-end" loading={inviting} disabled={!email} onClick={handleInvite}>
            Ajouter
          </Button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardBody>
    </Card>
  );
}

function AttendeesInner() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <OrganizerNav />
      <div className="container-page py-8">
        <EventTabs eventId={id} />
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="mb-3 font-semibold text-ink">Participants</h2>
            <AttendeesTable eventId={id} />
          </div>
          <div>
            <StaffManager eventId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AttendeesPage() {
  return (
    <RequireAuth roles={[UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <AttendeesInner />
    </RequireAuth>
  );
}
