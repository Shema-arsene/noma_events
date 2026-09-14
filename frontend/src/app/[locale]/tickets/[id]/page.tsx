"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import type { TicketDTO } from "@/types";
import { apiGet } from "@/lib/api";
import { RequireAuth } from "@/components/RequireAuth";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/format";

function TicketDetail() {
  const t = useTranslations("ticketDetail");
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["ticket", id],
    queryFn: async () => (await apiGet<TicketDTO>(`/tickets/${id}`)).data,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState message={t("ticketNotFound")} onRetry={() => refetch()} />;

  const isActive = data.status === "ACTIVE";

  const STATUS_LABEL: Record<TicketDTO["status"], string> = {
    ACTIVE: t("statusValid"),
    USED: t("statusUsed"),
    CANCELLED: t("statusCancelled"),
    REFUNDED: t("statusRefunded"),
  };

  return (
    <div className="container-page flex justify-center py-10">
      <div className="w-full max-w-sm overflow-hidden rounded-card border border-ink/10 bg-white shadow-card">
        <div className="relative h-40 w-full bg-sand">
          {data.event.coverImage && <Image src={data.event.coverImage} alt={data.event.title} fill className="object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <p className="font-display text-lg font-bold">{data.event.title}</p>
            <p className="text-xs text-white/80">{formatDateTime(data.event.startAt)}</p>
          </div>
        </div>

        <div className="p-6 text-center">
          <Badge tone={isActive ? "success" : data.status === "USED" ? "neutral" : "danger"}>
            {STATUS_LABEL[data.status]}
          </Badge>

          <div className="my-6 flex justify-center">
            {isActive && data.qrImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- data: URL, next/image does not optimize these
              <img src={data.qrImage} alt={t("qrCodeAlt")} width={220} height={220} className="rounded-lg" />
            ) : (
              <div className="flex h-[220px] w-[220px] items-center justify-center rounded-lg bg-sand text-sm text-ink/50">
                {t("qrUnavailable")}
              </div>
            )}
          </div>

          <dl className="space-y-2 text-left text-sm">
            <Row label={t("holder")} value={data.attendeeName} />
            <Row label={t("ticketType")} value={data.ticketTypeName} />
            <Row label={t("venue")} value={data.event.city} />
            <Row label={t("reference")} value={data.displayCode} />
          </dl>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-ink/5 pb-2">
      <dt className="text-ink/50">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}

export default function TicketPage() {
  return (
    <RequireAuth>
      <TicketDetail />
    </RequireAuth>
  );
}
