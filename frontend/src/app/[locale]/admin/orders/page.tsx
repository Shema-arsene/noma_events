"use client";

import { useTranslations } from "next-intl";
import { OrdersTable } from "@/components/admin/OrdersTable";

export default function AdminOrdersPage() {
  const t = useTranslations("adminOrdersTable");
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">{t("pageTitle")}</h1>
      <div className="mt-6">
        <OrdersTable />
      </div>
    </div>
  );
}
