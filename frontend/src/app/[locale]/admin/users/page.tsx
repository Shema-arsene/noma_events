"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRole, type UserDTO } from "@/types";
import { apiGet, apiPatch, ApiRequestError } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { useConfirm } from "@/components/ui/ConfirmDialog";

function UsersList() {
  const t = useTranslations("adminUsers");
  const tRole = useTranslations("userRole");
  const tStatus = useTranslations("userStatus");
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await apiGet<UserDTO[]>("/admin/users?limit=100")).data,
  });

  async function updateStatus(user: UserDTO, status: "ACTIVE" | "SUSPENDED") {
    if (status === "SUSPENDED") {
      const ok = await confirm({
        title: t("suspendConfirmTitle", { name: user.name }),
        description: t("suspendConfirmDescription"),
        confirmLabel: t("suspend"),
        tone: "danger",
      });
      if (!ok) return;
    }
    setPendingId(user.id);
    setError(null);
    try {
      await apiPatch(`/admin/users/${user.id}/status`, { status });
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("genericError"));
    } finally {
      setPendingId(null);
    }
  }

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState message={t("loadError")} onRetry={() => refetch()} />;
  if (data.length === 0) return <EmptyState title={t("noUsers")} />;

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-danger">{error}</p>}
      <Table>
        <TableHead>
          <tr>
            <Th>{t("name")}</Th>
            <Th>{t("email")}</Th>
            <Th>{t("role")}</Th>
            <Th>{t("status")}</Th>
            <Th />
          </tr>
        </TableHead>
        <TableBody>
          {data.map((u) => (
            <TableRow key={u.id}>
              <Td className="font-medium text-ink">{u.name}</Td>
              <Td className="text-ink/60">{u.email}</Td>
              <Td>{tRole(u.role)}</Td>
              <Td>
                <Badge tone={u.status === "ACTIVE" ? "success" : "danger"}>{tStatus(u.status)}</Badge>
              </Td>
              <Td className="text-right">
                {u.role !== UserRole.SUPER_ADMIN && (
                  <Button
                    size="sm"
                    variant={u.status === "ACTIVE" ? "danger" : "outline"}
                    loading={pendingId === u.id}
                    onClick={() => updateStatus(u, u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
                  >
                    {u.status === "ACTIVE" ? t("suspend") : t("reactivate")}
                  </Button>
                )}
              </Td>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AdminUsersPage() {
  const t = useTranslations("adminUsers");
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">{t("title")}</h1>
      <div className="mt-6">
        <UsersList />
      </div>
    </div>
  );
}
