"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { CalendarDays, Clock, Receipt, ShieldCheck, Users, Wallet } from "lucide-react";
import type { AdminOverviewDTO } from "@/types";
import { apiGet } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { formatCurrency } from "@/lib/format";

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "ink",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "ink" | "teal" | "gold";
}) {
  const toneClasses = {
    ink: "bg-ink/8 text-ink/70",
    teal: "bg-teal/10 text-teal",
    gold: "bg-gold/15 text-gold-dark",
  }[tone];
  return (
    <Card>
      <CardBody className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-ink/40">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneClasses}`}>
          <Icon className="h-4 w-4" />
        </span>
      </CardBody>
    </Card>
  );
}

function RatioBar({ label, current, total }: { label: string; current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink/70">{label}</span>
        <span className="font-medium text-ink">
          {current} / {total} <span className="text-ink/40">({pct}%)</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink/8">
        <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminPage() {
  const t = useTranslations("adminOverview");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => (await apiGet<AdminOverviewDTO>("/admin/overview")).data,
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">{t("title")}</h1>
      <div className="mt-6">
        {isLoading ? (
          <LoadingState />
        ) : isError || !data ? (
          <ErrorState message={t("loadError")} onRetry={() => refetch()} />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label={t("users")} value={String(data.totalUsers)} icon={Users} />
              <StatCard label={t("organizers")} value={String(data.totalOrganizers)} icon={ShieldCheck} tone="teal" />
              <StatCard label={t("pendingVerification")} value={String(data.pendingOrganizers)} icon={Clock} tone="gold" />
              <StatCard label={t("grossSales")} value={formatCurrency(data.grossSalesXaf)} icon={Wallet} tone="gold" />
            </div>

            <Card className="mt-6">
              <CardBody className="grid gap-6 sm:grid-cols-2">
                <RatioBar label={t("publishedEvents")} current={data.publishedEvents} total={data.totalEvents} />
                <RatioBar label={t("paidOrders")} current={data.paidOrders} total={data.totalOrders} />
              </CardBody>
            </Card>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <StatCard label={t("events")} value={String(data.totalEvents)} icon={CalendarDays} />
              <StatCard label={t("orders")} value={String(data.totalOrders)} icon={Receipt} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
