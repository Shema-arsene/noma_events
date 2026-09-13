"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRole, type OrganizerDTO } from "@/types";
import { RequireAuth } from "@/components/RequireAuth";
import { AdminNav } from "@/components/admin/AdminNav";
import { apiGet, apiPatch, ApiRequestError } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";

const VERIFICATION_LABEL: Record<OrganizerDTO["verificationStatus"], string> = {
  VERIFIED: "Vérifié",
  REJECTED: "Rejeté",
  PENDING: "En attente",
};

function OrganizersList() {
  const queryClient = useQueryClient();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-organizers"],
    queryFn: async () => (await apiGet<OrganizerDTO[]>("/admin/organizers?limit=100")).data,
  });

  async function updateStatus(id: string, status: "VERIFIED" | "REJECTED") {
    setPendingId(id);
    setError(null);
    try {
      await apiPatch(`/admin/organizers/${id}/status`, { status });
      await queryClient.invalidateQueries({ queryKey: ["admin-organizers"] });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur");
    } finally {
      setPendingId(null);
    }
  }

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState message="Erreur de chargement" onRetry={() => refetch()} />;
  if (data.length === 0) return <EmptyState title="Aucun organisateur." />;

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {data.map((org) => (
        <div key={org.id} className="flex flex-col gap-2 rounded-card border border-ink/10 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-ink">{org.name}</p>
            <p className="text-xs text-ink/50">{org.contactEmail}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={org.verificationStatus === "VERIFIED" ? "success" : org.verificationStatus === "REJECTED" ? "danger" : "warning"}>
              {VERIFICATION_LABEL[org.verificationStatus]}
            </Badge>
            {org.verificationStatus !== "VERIFIED" && (
              <Button size="sm" loading={pendingId === org.id} onClick={() => updateStatus(org.id, "VERIFIED")}>
                Vérifier
              </Button>
            )}
            {org.verificationStatus !== "REJECTED" && (
              <Button size="sm" variant="danger" loading={pendingId === org.id} onClick={() => updateStatus(org.id, "REJECTED")}>
                Rejeter
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminOrganizersPage() {
  return (
    <RequireAuth roles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <div>
        <AdminNav />
        <div className="container-page py-8">
          <h1 className="font-display text-2xl font-bold text-ink">Organisateurs</h1>
          <div className="mt-6">
            <OrganizersList />
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
