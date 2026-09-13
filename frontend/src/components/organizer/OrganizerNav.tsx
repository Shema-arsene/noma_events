"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/organizer", label: "Aperçu" },
  { href: "/organizer/events", label: "Événements" },
];

export function OrganizerNav() {
  const pathname = usePathname();
  return (
    <div className="border-b border-ink/10 bg-white">
      <div className="container-page flex gap-1 overflow-x-auto">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "focus-ring whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium",
                active ? "border-teal text-teal" : "border-transparent text-ink/60 hover:text-ink",
              )}
            >
              {link.label}
            </Link>
          );
        })}
        <Link
          href="/organizer/events/new"
          className="focus-ring ml-auto whitespace-nowrap self-center rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white"
        >
          + Créer un événement
        </Link>
      </div>
    </div>
  );
}

export function EventTabs({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const tabs = [
    { href: `/organizer/events/${eventId}`, label: "Détails" },
    { href: `/organizer/events/${eventId}/tickets`, label: "Billets" },
    { href: `/organizer/events/${eventId}/attendees`, label: "Participants" },
    { href: `/organizer/events/${eventId}/analytics`, label: "Analytique" },
  ];
  return (
    <div className="mt-4 flex gap-1 overflow-x-auto border-b border-ink/10">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "focus-ring whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium",
              active ? "border-teal text-teal" : "border-transparent text-ink/60 hover:text-ink",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
