"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
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
  const t = useTranslations("adminOrdersTable");
  const tStatus = useTranslations("orderStatus");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await apiGet<AdminOrderRow[]>("/admin/orders?limit=100")).data,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState message={t("loadError")} onRetry={() => refetch()} />;

  const rows = filter ? data.filter(filter) : data;
  if (rows.length === 0) return <EmptyState title={t("noOrders")} />;

  return (
    <Table>
      <TableHead>
        <tr>
          <Th>{t("order")}</Th>
          <Th>{t("event")}</Th>
          <Th>{t("amount")}</Th>
          <Th>{t("status")}</Th>
          <Th>{t("date")}</Th>
        </tr>
      </TableHead>
      <TableBody>
        {rows.map((o) => (
          <TableRow key={o.id}>
            <Td className="font-mono text-xs">{o.orderNumber}</Td>
            <Td>{o.eventTitle ?? "—"}</Td>
            <Td className="font-medium text-ink">{formatXaf(o.totalXaf)}</Td>
            <Td>
              <Badge tone={STATUS_TONE[o.status] ?? "neutral"}>{tStatus.has(o.status) ? tStatus(o.status) : o.status}</Badge>
            </Td>
            <Td className="text-ink/50">{formatDateTime(o.createdAt)}</Td>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
