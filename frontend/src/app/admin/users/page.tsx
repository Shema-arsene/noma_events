"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRole, type UserDTO } from "@/types";
import { RequireAuth } from "@/components/RequireAuth";
import { AdminNav } from "@/components/admin/AdminNav";
import { apiGet, apiPatch, ApiRequestError } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";

function UsersList() {
  const queryClient = useQueryClient();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await apiGet<UserDTO[]>("/admin/users?limit=100")).data,
  });

  async function updateStatus(id: string, status: "ACTIVE" | "SUSPENDED") {
    setPendingId(id);
    setError(null);
    try {
      await apiPatch(`/admin/users/${id}/status`, { status });
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur");
    } finally {
      setPendingId(null);
    }
  }

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState message="Erreur de chargement" onRetry={() => refetch()} />;
  if (data.length === 0) return <EmptyState title="Aucun utilisateur." />;

  return (
    <div className="overflow-x-auto rounded-card border border-ink/10 bg-white">
      {error && <p className="p-3 text-sm text-red-600">{error}</p>}
      <table className="w-full text-sm">
        <thead className="bg-ivory text-left text-xs uppercase text-ink/50">
          <tr>
            <th className="px-4 py-3">Nom</th>
            <th className="px-4 py-3">E-mail</th>
            <th className="px-4 py-3">Rôle</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {data.map((u) => (
            <tr key={u.id} className="border-t border-ink/5">
              <td className="px-4 py-3">{u.name}</td>
              <td className="px-4 py-3 text-ink/60">{u.email}</td>
              <td className="px-4 py-3">{u.role}</td>
              <td className="px-4 py-3">
                <Badge tone={u.status === "ACTIVE" ? "success" : "danger"}>{u.status}</Badge>
              </td>
              <td className="px-4 py-3 text-right">
                {u.role !== UserRole.SUPER_ADMIN && (
                  <Button
                    size="sm"
                    variant={u.status === "ACTIVE" ? "danger" : "outline"}
                    loading={pendingId === u.id}
                    onClick={() => updateStatus(u.id, u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
                  >
                    {u.status === "ACTIVE" ? "Suspendre" : "Réactiver"}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <RequireAuth roles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <div>
        <AdminNav />
        <div className="container-page py-8">
          <h1 className="font-display text-2xl font-bold text-ink">Utilisateurs</h1>
          <div className="mt-6">
            <UsersList />
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
