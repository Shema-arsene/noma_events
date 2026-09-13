"use client";

import { useQuery } from "@tanstack/react-query";
import { UserRole, type AdminOverviewDTO } from "@/types";
import { RequireAuth } from "@/components/RequireAuth";
import { AdminNav } from "@/components/admin/AdminNav";
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

function AdminOverview() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => (await apiGet<AdminOverviewDTO>("/admin/overview")).data,
  });

  return (
    <div>
      <AdminNav />
      <div className="container-page py-8">
        <h1 className="font-display text-2xl font-bold text-ink">Tableau de bord administrateur</h1>
        <div className="mt-6">
          {isLoading ? (
            <LoadingState />
          ) : isError || !data ? (
            <ErrorState message="Erreur de chargement" onRetry={() => refetch()} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Utilisateurs" value={String(data.totalUsers)} />
              <StatCard label="Organisateurs" value={String(data.totalOrganizers)} />
              <StatCard label="Organisateurs en attente" value={String(data.pendingOrganizers)} />
              <StatCard label="Événements publiés" value={`${data.publishedEvents} / ${data.totalEvents}`} />
              <StatCard label="Commandes totales" value={String(data.totalOrders)} />
              <StatCard label="Commandes payées" value={String(data.paidOrders)} />
              <StatCard label="Ventes brutes" value={formatCurrency(data.grossSalesXaf)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth roles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <AdminOverview />
    </RequireAuth>
  );
}
