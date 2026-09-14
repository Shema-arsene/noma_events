"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { UserRole, type OrganizerAnalyticsDTO } from "@/types";
import { RequireAuth } from "@/components/RequireAuth";
import { apiGet } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
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
  const t = useTranslations("analytics");
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["event-analytics", id],
    queryFn: async () => (await apiGet<OrganizerAnalyticsDTO>(`/organizers/events/${id}/analytics`)).data,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState message={t("loadError")} onRetry={() => refetch()} />;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("ticketsSold")} value={String(data.ticketsSold)} />
        <StatCard label={t("grossSales")} value={formatCurrency(data.grossSalesXaf)} />
        <StatCard label={t("paidOrders")} value={String(data.paidOrders)} />
        <StatCard label={t("checkInRate")} value={`${Math.round(data.checkInRate * 100)}%`} />
      </div>

      <Card className="mt-6">
        <CardBody>
          <h2 className="font-semibold text-ink">{t("salesByTicketType")}</h2>
          {data.salesByTicketType.length === 0 ? (
            <EmptyState className="mt-3" title={t("noSalesYet")} />
          ) : (
            <>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.salesByTicketType} margin={{ left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,17,17,0.08)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "rgba(17,17,17,0.5)" }} tickLine={false} axisLine={{ stroke: "rgba(17,17,17,0.1)" }} />
                    <YAxis tick={{ fontSize: 12, fill: "rgba(17,17,17,0.5)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        const row = payload?.[0]?.payload as { name: string; sold: number; grossXaf: number } | undefined;
                        if (!active || !row) return null;
                        return (
                          <div className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-xs shadow-popover">
                            <p className="font-semibold text-ink">{row.name}</p>
                            <p className="mt-0.5 text-ink/60">{t("sold", { count: row.sold })} · {formatCurrency(row.grossXaf)}</p>
                          </div>
                        );
                      }}
                      cursor={{ fill: "rgba(17,17,17,0.04)" }}
                    />
                    <Bar dataKey="sold" name={t("ticketsSold")} fill="#167c80" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2 border-t border-ink/10 pt-4">
                {data.salesByTicketType.map((row) => (
                  <div key={row.ticketTypeId} className="flex items-center justify-between text-sm">
                    <span className="text-ink">{row.name}</span>
                    <span className="text-ink/60">
                      {t("sold", { count: row.sold })} · <span className="font-medium text-gold-dark">{formatCurrency(row.grossXaf)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardBody>
      </Card>
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
