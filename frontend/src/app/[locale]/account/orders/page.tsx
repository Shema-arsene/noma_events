"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import type { OrderDTO } from "@/types";
import { apiGet } from "@/lib/api";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime, formatXaf } from "@/lib/format";
import { Link } from "@/i18n/navigation";

const STATUS_TONE: Record<OrderDTO["status"], "success" | "neutral" | "danger" | "warning"> = {
  PAID: "success",
  PENDING: "warning",
  FAILED: "danger",
  CANCELLED: "neutral",
  REFUNDED: "warning",
  EXPIRED: "neutral",
};

function OrdersList() {
  const t = useTranslations("account");
  const tStatus = useTranslations("orderStatus");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => (await apiGet<OrderDTO[]>("/me/orders")).data,
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={t("ordersLoadError")} onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <EmptyState title={t("noOrdersYet")} />;

  return (
    <div className="space-y-3">
      {data.map((order) => (
        <Link
          key={order.id}
          href={`/events/${order.event.slug}`}
          className="focus-ring flex flex-col gap-1 rounded-card border border-ink/10 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-sm font-semibold text-ink">{order.event.title}</p>
            <p className="text-xs text-ink/50">
              {order.orderNumber} · {formatDateTime(order.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-ink">{formatXaf(order.totalXaf)}</span>
            <Badge tone={STATUS_TONE[order.status]}>{tStatus(order.status)}</Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const t = useTranslations("account");
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">{t("myOrders")}</h1>
      <div className="mt-6">
        <OrdersList />
      </div>
    </div>
  );
}
