"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { formatDateTime, formatXaf } from "@/lib/format";

export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  totalXaf: number;
  status: string;
  createdAt: string;
  eventTitle?: string;
  eventSlug?: string;
}

const STATUS_TONE: Record<string, "success" | "neutral" | "danger" | "warning"> = {
  PAID: "success",
  PENDING: "warning",
  FAILED: "danger",
  CANCELLED: "neutral",
  REFUNDED: "warning",
  EXPIRED: "neutral",
};

export function OrdersTable({ filter }: { filter?: (row: AdminOrderRow) => boolean }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await apiGet<AdminOrderRow[]>("/admin/orders?limit=100")).data,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState message="Erreur de chargement" onRetry={() => refetch()} />;

  const rows = filter ? data.filter(filter) : data;
  if (rows.length === 0) return <EmptyState title="Aucune commande." />;

  return (
    <div className="overflow-x-auto rounded-card border border-ink/10 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-ivory text-left text-xs uppercase text-ink/50">
          <tr>
            <th className="px-4 py-3">Commande</th>
            <th className="px-4 py-3">Événement</th>
            <th className="px-4 py-3">Montant</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id} className="border-t border-ink/5">
              <td className="px-4 py-3 font-mono text-xs">{o.orderNumber}</td>
              <td className="px-4 py-3">{o.eventTitle ?? "—"}</td>
              <td className="px-4 py-3 font-medium">{formatXaf(o.totalXaf)}</td>
              <td className="px-4 py-3">
                <Badge tone={STATUS_TONE[o.status] ?? "neutral"}>{o.status}</Badge>
              </td>
              <td className="px-4 py-3 text-ink/50">{formatDateTime(o.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
