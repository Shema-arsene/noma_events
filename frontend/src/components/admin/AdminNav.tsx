"use client";

import { useTranslations } from "next-intl";
import { CalendarDays, CreditCard, LayoutGrid, Receipt, ShieldCheck, Users } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

export function AdminNav() {
  const t = useTranslations("adminNav");
  const pathname = usePathname();

  const LINKS = [
    { href: "/admin", label: t("overview"), icon: LayoutGrid },
    { href: "/admin/events", label: t("events"), icon: CalendarDays },
    { href: "/admin/organizers", label: t("organizers"), icon: ShieldCheck },
    { href: "/admin/users", label: t("users"), icon: Users },
    { href: "/admin/orders", label: t("orders"), icon: Receipt },
    { href: "/admin/payments", label: t("payments"), icon: CreditCard },
  ];

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
                "focus-ring flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium",
                active ? "border-teal text-teal" : "border-transparent text-ink/60 hover:text-ink",
              )}
            >
              <link.icon className="h-4 w-4" /> {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
