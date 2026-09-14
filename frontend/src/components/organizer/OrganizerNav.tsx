"use client";

import { useTranslations } from "next-intl";
import { BarChart3, LayoutGrid, Plus, Ticket, Users } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

export function OrganizerNav() {
  const t = useTranslations("organizerNav");
  const pathname = usePathname();

  const LINKS = [
    { href: "/organizer", label: t("overview"), icon: LayoutGrid },
    { href: "/organizer/events", label: t("events"), icon: Ticket },
  ];

  return (
    <div className="border-b border-ink/10 bg-white">
      <div className="container-page flex items-center gap-1 overflow-x-auto">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "focus-ring flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium",
                active ? "border-teal text-teal" : "border-transparent text-ink/60 hover:text-ink",
              )}
            >
              <link.icon className="h-4 w-4" /> {link.label}
            </Link>
          );
        })}
        <Link
          href="/organizer/events/new"
          className="focus-ring ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap self-center rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          <Plus className="h-4 w-4" /> {t("createEvent")}
        </Link>
      </div>
    </div>
  );
}

export function EventTabs({ eventId }: { eventId: string }) {
  const t = useTranslations("organizerNav");
  const pathname = usePathname();
  const tabs = [
    { href: `/organizer/events/${eventId}`, label: t("details"), icon: LayoutGrid },
    { href: `/organizer/events/${eventId}/tickets`, label: t("tickets"), icon: Ticket },
    { href: `/organizer/events/${eventId}/attendees`, label: t("attendees"), icon: Users },
    { href: `/organizer/events/${eventId}/analytics`, label: t("analytics"), icon: BarChart3 },
  ];
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-ink/10">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "focus-ring flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium",
              active ? "border-teal text-teal" : "border-transparent text-ink/60 hover:text-ink",
            )}
          >
            <tab.icon className="h-3.5 w-3.5" /> {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
