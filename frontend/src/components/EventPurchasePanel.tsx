"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Minus, Plus } from "lucide-react";
import type { EventDTO } from "@/types";
import { formatXaf } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

export function EventPurchasePanel({ event }: { event: EventDTO }) {
  const t = useTranslations("eventDetail");
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const ticketTypes = useMemo(() => event.ticketTypes ?? [], [event.ticketTypes]);

  const totalXaf = useMemo(
    () =>
      ticketTypes.reduce((sum, tt) => sum + (quantities[tt.id] ?? 0) * tt.priceXaf, 0),
    [ticketTypes, quantities],
  );
  const totalQty = useMemo(() => Object.values(quantities).reduce((a, b) => a + b, 0), [quantities]);

  const canPurchase = event.status === "PUBLISHED" && ticketTypes.some((tt) => tt.remaining > 0);

  function setQty(id: string, qty: number, max: number) {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, Math.min(qty, max, 20)) }));
  }

  function handleCheckout() {
    if (totalQty === 0) return;
    const params = new URLSearchParams();
    Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .forEach(([id, qty]) => params.set(`qty_${id}`, String(qty)));
    router.push(`/checkout/${event.id}?${params.toString()}`);
  }

  if (event.status === "CANCELLED") {
    return (
      <Card>
        <CardBody className="text-center">
          <p className="font-semibold text-danger">{t("eventCancelled")}</p>
          <p className="mt-1 text-sm text-ink/60">{t("ticketsNoLongerValid")}</p>
        </CardBody>
      </Card>
    );
  }

  if (event.status === "COMPLETED") {
    return (
      <Card>
        <CardBody className="text-center text-ink/60">{t("eventEnded")}</CardBody>
      </Card>
    );
  }

  if (ticketTypes.length === 0) {
    return (
      <Card>
        <CardBody className="text-center text-ink/60">{t("ticketsNotAvailableYet")}</CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <h2 className="font-display text-lg font-semibold text-ink">{t("tickets")}</h2>
        <div className="mt-4 space-y-3">
          {ticketTypes.map((tt) => (
            <div key={tt.id} className="flex items-center justify-between gap-3 rounded-xl border border-ink/10 p-3">
              <div>
                <p className="text-sm font-medium text-ink">{tt.name}</p>
                <p className="text-sm font-semibold text-gold-dark">{formatXaf(tt.priceXaf)}</p>
                <p className="text-xs text-ink/50">{tt.remaining > 0 ? t("remaining", { count: tt.remaining }) : t("soldOut")}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQty(tt.id, (quantities[tt.id] ?? 0) - 1, tt.remaining)}
                  disabled={tt.remaining === 0}
                  className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg border border-ink/15 text-ink hover:bg-ink/5 disabled:opacity-30"
                  aria-label={t("removeTicket")}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-medium">{quantities[tt.id] ?? 0}</span>
                <button
                  type="button"
                  onClick={() => setQty(tt.id, (quantities[tt.id] ?? 0) + 1, tt.remaining)}
                  disabled={tt.remaining === 0}
                  className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg border border-ink/15 text-ink hover:bg-ink/5 disabled:opacity-30"
                  aria-label={t("addTicket")}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-4 text-sm">
          <span className="text-ink/60">{t("total")}</span>
          <span className="font-display text-lg font-bold text-ink">{formatXaf(totalXaf)}</span>
        </div>

        <Button className="mt-4 w-full" size="lg" disabled={!canPurchase || totalQty === 0} onClick={handleCheckout}>
          {t("viewTickets")}
        </Button>
      </CardBody>
    </Card>
  );
}
