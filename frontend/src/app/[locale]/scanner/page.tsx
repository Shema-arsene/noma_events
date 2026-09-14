"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Ban, CheckCircle2, Clock, RotateCcw, Shuffle, XCircle } from "lucide-react";
import { UserRole } from "@/types";
import { RequireAuth } from "@/components/RequireAuth";
import { QrScanner } from "@/components/scanner/QrScanner";
import { apiGet, apiPost, ApiRequestError } from "@/lib/api";
import { Select } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingState, EmptyState } from "@/components/ui/States";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";

interface AssignedEvent {
  id: string;
  title: string;
  startAt: string;
  city: string;
  status: string;
}

interface ScanResponse {
  result: "VALID" | "ALREADY_USED" | "INVALID" | "WRONG_EVENT" | "CANCELLED" | "REFUNDED";
  ticket?: { attendeeName: string; ticketTypeName: string; displayCode: string };
}

function ScannerInner() {
  const t = useTranslations("scannerPage");
  const [eventId, setEventId] = useState<string>("");
  const [lastResult, setLastResult] = useState<ScanResponse | null>(null);
  const [scanning, setScanning] = useState(false);
  const [history, setHistory] = useState<ScanResponse[]>([]);

  const RESULT_STYLES: Record<ScanResponse["result"], { bg: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
    VALID: { bg: "bg-success", label: t("resultValid"), icon: CheckCircle2 },
    ALREADY_USED: { bg: "bg-warning", label: t("resultAlreadyUsed"), icon: Clock },
    INVALID: { bg: "bg-danger", label: t("resultInvalid"), icon: XCircle },
    WRONG_EVENT: { bg: "bg-gold-dark", label: t("resultWrongEvent"), icon: Shuffle },
    CANCELLED: { bg: "bg-ink", label: t("resultCancelled"), icon: Ban },
    REFUNDED: { bg: "bg-ink/70", label: t("resultRefunded"), icon: RotateCcw },
  };

  const { data: events, isLoading } = useQuery({
    queryKey: ["scan-events"],
    queryFn: async () => (await apiGet<AssignedEvent[]>("/me/scan-events")).data,
  });

  const { data: attendance, refetch: refetchAttendance } = useQuery({
    queryKey: ["attendance-count", eventId],
    queryFn: async () => (await apiGet<{ count: number }>(`/checkins/${eventId}/attendance-count`)).data,
    enabled: Boolean(eventId),
  });

  async function handleScan(payload: string) {
    if (!eventId || scanning) return;
    setScanning(true);
    try {
      const { data } = await apiPost<ScanResponse>("/checkins/scan", { eventId, qrToken: payload });
      setLastResult(data);
      setHistory((h) => [data, ...h].slice(0, 20));
      void refetchAttendance();
    } catch (err) {
      setLastResult({ result: "INVALID" });
      void err;
    } finally {
      setTimeout(() => setScanning(false), 1200);
    }
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="container-page max-w-2xl py-8">
      <h1 className="font-display text-2xl font-bold text-ink">{t("title")}</h1>

      {!events || events.length === 0 ? (
        <EmptyState className="mt-6" title={t("noEventAssigned")} description={t("noEventAssignedDescription")} />
      ) : (
        <>
          <div className="mt-4">
            <Select value={eventId} onChange={(e) => setEventId(e.target.value)}>
              <option value="">{t("selectEvent")}</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} — {formatDateTime(ev.startAt)}
                </option>
              ))}
            </Select>
          </div>

          {eventId && (
            <>
              {attendance && (
                <p className="mt-3 text-center text-sm text-ink/60">
                  {t("attendance")} <span className="font-semibold text-ink">{attendance.count}</span>
                </p>
              )}

              <div className="mt-4">
                <QrScanner onScan={handleScan} disabled={scanning} />
              </div>

              {lastResult && (
                <div className={cn("mt-4 flex flex-col items-center gap-2 rounded-card p-6 text-center text-white", RESULT_STYLES[lastResult.result].bg)}>
                  {(() => {
                    const Icon = RESULT_STYLES[lastResult.result].icon;
                    return <Icon className="h-10 w-10" />;
                  })()}
                  <p className="font-display text-2xl font-bold">{RESULT_STYLES[lastResult.result].label}</p>
                  {lastResult.ticket && (
                    <p className="text-sm text-white/90">
                      {lastResult.ticket.attendeeName} · {lastResult.ticket.ticketTypeName}
                    </p>
                  )}
                </div>
              )}

              {history.length > 0 && (
                <Card className="mt-6">
                  <CardBody>
                    <h2 className="text-sm font-semibold text-ink">{t("recentHistory")}</h2>
                    <ul className="mt-2 space-y-1 text-sm text-ink/60">
                      {history.map((h, i) => {
                        const Icon = RESULT_STYLES[h.result].icon;
                        return (
                          <li key={i} className="flex items-center justify-between border-b border-ink/5 py-1.5">
                            <span>{h.ticket?.attendeeName ?? "—"}</span>
                            <span className="flex items-center gap-1.5">
                              <Icon className="h-3.5 w-3.5" /> {RESULT_STYLES[h.result].label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </CardBody>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function ScannerPage() {
  return (
    <RequireAuth roles={[UserRole.EVENT_STAFF, UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <ScannerInner />
    </RequireAuth>
  );
}
