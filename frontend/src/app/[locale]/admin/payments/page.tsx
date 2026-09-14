"use client";

import { useTranslations } from "next-intl";
import { OrdersTable, type AdminOrderRow } from "@/components/admin/OrdersTable";

const PAYMENT_STATUSES = new Set(["PAID", "FAILED", "REFUNDED"]);

export default function AdminPaymentsPage() {
  const t = useTranslations("adminPayments");
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">{t("title")}</h1>
      <p className="mt-1 text-sm text-ink/60">{t("subtitle")}</p>
      <div className="mt-6">
        <OrdersTable filter={(row: AdminOrderRow) => PAYMENT_STATUSES.has(row.status)} />
      </div>
    </div>
  );
}
