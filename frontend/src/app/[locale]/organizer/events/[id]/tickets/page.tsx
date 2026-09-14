"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRole, type TicketTypeDTO } from "@/types";
import { RequireAuth } from "@/components/RequireAuth";
import { apiGet, apiPost, apiPatch, apiDelete, ApiRequestError } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { formatXaf } from "@/lib/format";

const emptyForm = { name: "", priceXaf: 0, quantity: 100, salesStartAt: "", salesEndAt: "" };

function TicketTypesInner() {
  const t = useTranslations("ticketTypes");
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
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
      setError(err instanceof ApiRequestError ? err.message : t("createError"));
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(tt: TicketTypeDTO) {
    await apiPatch(`/organizers/events/${id}/ticket-types/${tt.id}`, { active: !tt.active });
    await queryClient.invalidateQueries({ queryKey: ["organizer-ticket-types", id] });
  }

  async function handleDelete(tt: TicketTypeDTO) {
    const ok = await confirm({
      title: t("deleteConfirmTitle", { name: tt.name }),
      description: t("deleteConfirmDescription"),
      confirmLabel: t("delete"),
      tone: "danger",
    });
    if (!ok) return;
    try {
      await apiDelete(`/organizers/events/${id}/ticket-types/${tt.id}`);
      await queryClient.invalidateQueries({ queryKey: ["organizer-ticket-types", id] });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("deleteError"));
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {isLoading ? (
        <LoadingState />
      ) : isError || !data ? (
        <ErrorState message={t("loadError")} onRetry={() => refetch()} />
      ) : (
        <div className="space-y-3">
          {data.map((tt) => (
            <Card key={tt.id}>
              <CardBody className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{tt.name}</p>
                  <p className="text-sm text-ink/60">
                    {formatXaf(tt.priceXaf)} · {t("sold", { sold: tt.soldQuantity, total: tt.quantity })} · {t("remaining", { count: tt.remaining })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={tt.active ? "success" : "neutral"}>{tt.active ? t("active") : t("inactive")}</Badge>
                  <Button size="sm" variant="outline" onClick={() => toggleActive(tt)}>
                    {tt.active ? t("deactivate") : t("activate")}
                  </Button>
                  {tt.soldQuantity === 0 && (
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(tt)}>
                      {t("delete")}
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
          <h2 className="font-semibold text-ink">{t("addTicketType")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label required>{t("name")}</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label required>{t("price")}</Label>
              <Input type="number" min={0} value={form.priceXaf} onChange={(e) => setForm((f) => ({ ...f, priceXaf: Number(e.target.value) }))} />
            </div>
            <div>
              <Label required>{t("quantity")}</Label>
              <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))} />
            </div>
            <div>
              <Label required>{t("salesEnd")}</Label>
              <Input type="datetime-local" value={form.salesEndAt} onChange={(e) => setForm((f) => ({ ...f, salesEndAt: e.target.value }))} />
            </div>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button loading={creating} onClick={handleCreate} disabled={!form.name || !form.salesEndAt}>
            {t("add")}
          </Button>
        </CardBody>
      </Card>
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
