"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { UserRole, type OrganizerAnalyticsDTO } from "@/types";
import { RequireAuth } from "@/components/RequireAuth";
import { OrganizerNav, EventTabs } from "@/components/organizer/OrganizerNav";
import { apiGet } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { formatCurrency } from "@/lib/format";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs font-semibold uppercase text-ink/40">{label}</p>
        <p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p>
      </CardBody>
    </Card>
  );
}

function AnalyticsInner() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["event-analytics", id],
    queryFn: async () => (await apiGet<OrganizerAnalyticsDTO>(`/organizers/events/${id}/analytics`)).data,
  });

  return (
    <div>
      <OrganizerNav />
      <div className="container-page py-8">
        <EventTabs eventId={id} />
        <div className="mt-6">
          {isLoading ? (
            <LoadingState />
          ) : isError || !data ? (
            <ErrorState message="Erreur de chargement" onRetry={() => refetch()} />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Billets vendus" value={String(data.ticketsSold)} />
                <StatCard label="Ventes brutes" value={formatCurrency(data.grossSalesXaf)} />
                <StatCard label="Commandes payées" value={String(data.paidOrders)} />
                <StatCard label="Taux de présence" value={`${Math.round(data.checkInRate * 100)}%`} />
              </div>

              <Card className="mt-6">
                <CardBody>
                  <h2 className="font-semibold text-ink">Ventes par type de billet</h2>
                  {data.salesByTicketType.length === 0 ? (
                    <p className="mt-2 text-sm text-ink/50">Aucune vente pour le moment.</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {data.salesByTicketType.map((row) => (
                        <div key={row.ticketTypeId} className="flex items-center justify-between border-b border-ink/5 py-2 text-sm">
                          <span className="text-ink">{row.name}</span>
                          <span className="text-ink/60">
                            {row.sold} vendus · <span className="font-medium text-gold-dark">{formatCurrency(row.grossXaf)}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <RequireAuth roles={[UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <AnalyticsInner />
    </RequireAuth>
  );
}
