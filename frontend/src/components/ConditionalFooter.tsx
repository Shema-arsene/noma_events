"use client";

import { usePathname } from "@/i18n/navigation";
import { Footer } from "@/components/Footer";

const DASHBOARD_PREFIXES = ["/admin", "/organizer", "/scanner"];

/** Suppresses the marketing footer inside dashboard sections, which have their own chrome. */
export function ConditionalFooter() {
  const pathname = usePathname();
  if (DASHBOARD_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;
  return <Footer />;
}
