"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { UserRole } from "@/types";
import { RequireAuth } from "@/components/RequireAuth";
import { apiGet, apiPost, apiDelete, ApiRequestError } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";

interface Attendee {
  id: string;
  attendeeName: string;
  ticketTypeName: string;
  displayCode: string;
  status: string;
  issuedAt: string;
  usedAt?: string;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  active: boolean;
}

function AttendeesTable({ eventId }: { eventId: string }) {
  const t = useTranslations("attendees");
  const tStatus = useTranslations("ticketStatus");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["event-attendees", eventId],
    queryFn: async () => (await apiGet<Attendee[]>(`/organizers/events/${eventId}/attendees`)).data,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState message={t("loadError")} onRetry={() => refetch()} />;
  if (data.length === 0) return <EmptyState title={t("noTicketsSoldYet")} />;

  return (
    <Table>
      <TableHead>
        <tr>
          <Th>{t("name")}</Th>
          <Th>{t("ticket")}</Th>
          <Th>{t("code")}</Th>
          <Th>{t("status")}</Th>
        </tr>
      </TableHead>
      <TableBody>
        {data.map((a) => (
          <TableRow key={a.id}>
            <Td className="font-medium text-ink">{a.attendeeName}</Td>
            <Td>{a.ticketTypeName}</Td>
            <Td className="font-mono text-xs">{a.displayCode}</Td>
            <Td>
              <Badge tone={a.status === "USED" ? "success" : a.status === "ACTIVE" ? "teal" : "neutral"}>
                {tStatus.has(a.status) ? tStatus(a.status) : a.status}
              </Badge>
            </Td>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function StaffManager({ eventId }: { eventId: string }) {
  const t = useTranslations("attendees");
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: staff, isLoading } = useQuery({
    queryKey: ["event-staff", eventId],
    queryFn: async () => (await apiGet<StaffMember[]>(`/organizers/events/${eventId}/staff`)).data,
  });

  async function handleInvite() {
    setInviting(true);
    setError(null);
    try {
      await apiPost(`/organizers/events/${eventId}/staff`, { email, permissions: ["SCAN"] });
      setEmail("");
      await queryClient.invalidateQueries({ queryKey: ["event-staff", eventId] });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("addMemberError"));
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(staffId: string) {
    await apiDelete(`/organizers/events/${eventId}/staff/${staffId}`);
    await queryClient.invalidateQueries({ queryKey: ["event-staff", eventId] });
  }

  return (
    <Card>
      <CardBody className="space-y-3">
        <h2 className="font-semibold text-ink">{t("scanStaff")}</h2>
        <p className="text-sm text-ink/60">{t("scanStaffDescription")}</p>
        {isLoading ? (
          <LoadingState />
        ) : (
          <ul className="space-y-2">
            {staff?.filter((s) => s.active).map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg border border-ink/10 px-3 py-2 text-sm">
                <span>
                  {s.name} <span className="text-ink/50">({s.email})</span>
                </span>
                <button onClick={() => handleRemove(s.id)} className="focus-ring flex items-center gap-1 text-xs text-danger hover:underline">
                  <X className="h-3 w-3" /> {t("remove")}
                </button>
              </li>
            ))}
            {staff?.filter((s) => s.active).length === 0 && <p className="text-sm text-ink/50">{t("noMemberAssigned")}</p>}
          </ul>
        )}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="staffEmail">{t("memberEmail")}</Label>
            <Input id="staffEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button className="self-end" loading={inviting} disabled={!email} onClick={handleInvite}>
            {t("add")}
          </Button>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </CardBody>
    </Card>
  );
}

function AttendeesInner() {
  const t = useTranslations("attendees");
  const { id } = useParams<{ id: string }>();
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h2 className="mb-3 font-semibold text-ink">{t("participants")}</h2>
        <AttendeesTable eventId={id} />
      </div>
      <div>
        <StaffManager eventId={id} />
      </div>
    </div>
  );
}

export default function AttendeesPage() {
  return (
    <RequireAuth roles={[UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <AttendeesInner />
    </RequireAuth>
  );
}
