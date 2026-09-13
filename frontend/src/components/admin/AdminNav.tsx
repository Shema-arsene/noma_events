"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/admin", label: "Aperçu" },
  { href: "/admin/events", label: "Événements" },
  { href: "/admin/organizers", label: "Organisateurs" },
  { href: "/admin/users", label: "Utilisateurs" },
  { href: "/admin/orders", label: "Commandes" },
  { href: "/admin/payments", label: "Paiements" },
];

export function AdminNav() {
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
      </div>
    </div>
  );
}
