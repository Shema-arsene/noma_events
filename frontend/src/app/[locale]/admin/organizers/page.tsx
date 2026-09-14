"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, ShieldCheck, ShieldX } from "lucide-react";
import type { OrganizerDTO } from "@/types";
import { apiGet, apiPatch, ApiRequestError } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { useReasonPrompt } from "@/components/ui/ReasonDialog";
import { useToast } from "@/components/ui/Toast";

function OrganizersList() {
  const t = useTranslations("adminOrganizers");
  const queryClient = useQueryClient();
  const prompt = useReasonPrompt();
  const toast = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const VERIFICATION_LABEL: Record<OrganizerDTO["verificationStatus"], string> = {
    VERIFIED: t("verified"),
    REJECTED: t("rejected"),
    PENDING: t("pending"),
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-organizers"],
    queryFn: async () => (await apiGet<OrganizerDTO[]>("/admin/organizers?limit=100")).data,
  });

  async function updateStatus(org: OrganizerDTO, status: "VERIFIED" | "REJECTED") {
    let reason: string | null = "";
    if (status === "REJECTED") {
      reason = await prompt({
        title: t("rejectConfirmTitle", { name: org.name }),
        description: t("rejectConfirmDescription"),
        confirmLabel: t("reject"),
        tone: "danger",
      });
      if (reason === null) return;
    }
    setPendingId(org.id);
    setError(null);
    try {
      await apiPatch(`/admin/organizers/${org.id}/status`, { status, reason: reason || undefined });
      await queryClient.invalidateQueries({ queryKey: ["admin-organizers"] });
      toast({
        tone: "success",
        title: status === "VERIFIED" ? t("organizerVerified") : t("organizerRejected"),
        description: org.name,
      });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("genericError"));
    } finally {
      setPendingId(null);
    }
  }

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState message={t("loadError")} onRetry={() => refetch()} />;
  if (data.length === 0) return <EmptyState title={t("noOrganizers")} />;

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-danger">{error}</p>}
      {data.map((org) => (
        <div key={org.id} className="flex flex-col gap-3 rounded-card border border-ink/10 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-ink">{org.name}</p>
              <Badge tone={org.verificationStatus === "VERIFIED" ? "success" : org.verificationStatus === "REJECTED" ? "danger" : "warning"}>
                {VERIFICATION_LABEL[org.verificationStatus]}
              </Badge>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink/50">
              <Mail className="h-3.5 w-3.5" /> {org.contactEmail}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {org.verificationStatus !== "VERIFIED" && (
              <Button size="sm" loading={pendingId === org.id} onClick={() => updateStatus(org, "VERIFIED")}>
                <ShieldCheck className="h-3.5 w-3.5" /> {t("verify")}
              </Button>
            )}
            {org.verificationStatus !== "REJECTED" && (
              <Button size="sm" variant="danger" loading={pendingId === org.id} onClick={() => updateStatus(org, "REJECTED")}>
                <ShieldX className="h-3.5 w-3.5" /> {t("reject")}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminOrganizersPage() {
  const t = useTranslations("adminOrganizers");
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">{t("title")}</h1>
      <div className="mt-6">
        <OrganizersList />
      </div>
    </div>
  );
}
