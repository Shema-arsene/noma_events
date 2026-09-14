"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { EventDTO } from "@/types";
import { apiGet } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { EventTabs } from "@/components/organizer/OrganizerNav";

const STATUS_TONE: Record<EventDTO["status"], "neutral" | "success" | "danger"> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  CANCELLED: "danger",
  COMPLETED: "neutral",
  ARCHIVED: "neutral",
};

export default function OrganizerEventLayout({ children }: { children: React.ReactNode }) {
  const tStatus = useTranslations("eventStatus");
  const { id } = useParams<{ id: string }>();
  const { data: event } = useQuery({
    queryKey: ["organizer-event", id],
    queryFn: async () => (await apiGet<EventDTO>(`/organizers/events/${id}`)).data,
  });

  return (
    <div>
      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl font-bold text-ink">{event?.title ?? " "}</h1>
        {event && <Badge tone={STATUS_TONE[event.status]}>{tStatus(event.status)}</Badge>}
      </div>
      <div className="mt-4">
        <EventTabs eventId={id} />
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
