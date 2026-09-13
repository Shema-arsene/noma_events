"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRole, type TicketTypeDTO } from "@/types";
import { RequireAuth } from "@/components/RequireAuth";
import { OrganizerNav, EventTabs } from "@/components/organizer/OrganizerNav";
import { apiGet, apiPost, apiPatch, apiDelete, ApiRequestError } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { formatXaf } from "@/lib/format";

const emptyForm = { name: "", priceXaf: 0, quantity: 100, salesStartAt: "", salesEndAt: "" };

function TicketTypesInner() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["organizer-ticket-types", id],
    queryFn: async () => (await apiGet<TicketTypeDTO[]>(`/organizers/events/${id}/ticket-types`)).data,
  });

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      await apiPost(`/organizers/events/${id}/ticket-types`, {
        name: form.name,
        priceXaf: Number(form.priceXaf),
        quantity: Number(form.quantity),
        salesStartAt: form.salesStartAt || now,
        salesEndAt: form.salesEndAt,
      });
      setForm(emptyForm);
      await queryClient.invalidateQueries({ queryKey: ["organizer-ticket-types", id] });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(tt: TicketTypeDTO) {
    await apiPatch(`/organizers/events/${id}/ticket-types/${tt.id}`, { active: !tt.active });
    await queryClient.invalidateQueries({ queryKey: ["organizer-ticket-types", id] });
  }

  async function handleDelete(tt: TicketTypeDTO) {
    if (!confirm(`Supprimer le type de billet "${tt.name}" ?`)) return;
    try {
      await apiDelete(`/organizers/events/${id}/ticket-types/${tt.id}`);
      await queryClient.invalidateQueries({ queryKey: ["organizer-ticket-types", id] });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Impossible de supprimer");
    }
  }

  return (
    <div>
      <OrganizerNav />
      <div className="container-page py-8">
        <EventTabs eventId={id} />
        <div className="mt-6 max-w-2xl space-y-6">
          {isLoading ? (
            <LoadingState />
          ) : isError || !data ? (
            <ErrorState message="Erreur de chargement" onRetry={() => refetch()} />
          ) : (
            <div className="space-y-3">
              {data.map((tt) => (
                <Card key={tt.id}>
                  <CardBody className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink">{tt.name}</p>
                      <p className="text-sm text-ink/60">
                        {formatXaf(tt.priceXaf)} · {tt.soldQuantity}/{tt.quantity} vendus · {tt.remaining} restants
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={tt.active ? "success" : "neutral"}>{tt.active ? "Actif" : "Inactif"}</Badge>
                      <Button size="sm" variant="outline" onClick={() => toggleActive(tt)}>
                        {tt.active ? "Désactiver" : "Activer"}
                      </Button>
                      {tt.soldQuantity === 0 && (
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(tt)}>
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <CardBody className="space-y-3">
              <h2 className="font-semibold text-ink">Ajouter un type de billet</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label required>Nom</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <Label required>Prix (XAF)</Label>
                  <Input type="number" min={0} value={form.priceXaf} onChange={(e) => setForm((f) => ({ ...f, priceXaf: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label required>Quantité</Label>
                  <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label required>Fin des ventes</Label>
                  <Input type="datetime-local" value={form.salesEndAt} onChange={(e) => setForm((f) => ({ ...f, salesEndAt: e.target.value }))} />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button loading={creating} onClick={handleCreate} disabled={!form.name || !form.salesEndAt}>
                Ajouter
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function TicketTypesPage() {
  return (
    <RequireAuth roles={[UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <TicketTypesInner />
    </RequireAuth>
  );
}
