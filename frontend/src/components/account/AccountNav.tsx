"use client";

import { useTranslations } from "next-intl";
import { Receipt, Ticket, UserRound } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

export function AccountNav() {
  const t = useTranslations("accountNav");
  const pathname = usePathname();

  const LINKS = [
    { href: "/account", label: t("profile"), icon: UserRound },
    { href: "/account/tickets", label: t("tickets"), icon: Ticket },
    { href: "/account/orders", label: t("orders"), icon: Receipt },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-ink/10">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "focus-ring -mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-3 text-sm font-medium",
              active ? "border-teal text-ink" : "border-transparent text-ink/55 hover:text-ink",
            )}
          >
            <link.icon className="h-4 w-4" /> {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
