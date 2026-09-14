"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { cn } from "@/lib/cn";

const LOCALE_LABELS: Record<string, string> = { fr: "Français", en: "English" };

export function LocaleSwitcher({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();

  function switchTo(nextLocale: string) {
    router.replace(
      // @ts-expect-error -- params shape is dynamic per-route, next-intl types this loosely
      { pathname, params },
      { locale: nextLocale },
    );
  }

  if (variant === "mobile") {
    return (
      <div className="flex items-center gap-2 px-2.5 py-2">
        <Languages className="h-4 w-4 text-ink/40" />
        <span className="text-sm text-ink/50">{t("language")}</span>
        <div className="ml-auto flex gap-1">
          {routing.locales.map((l) => (
            <button
              key={l}
              onClick={() => switchTo(l)}
              className={cn(
                "focus-ring rounded-full px-2.5 py-1 text-xs font-medium",
                l === locale ? "bg-ink text-white" : "bg-ink/8 text-ink/60 hover:bg-ink/15",
              )}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="focus-ring flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-sm font-medium hover:border-ink/25"
          aria-label={t("language")}
        >
          <Languages className="h-4 w-4 text-ink/50" /> {locale.toUpperCase()}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {routing.locales.map((l) => (
          <DropdownMenuItem key={l} onSelect={() => switchTo(l)} className={cn(l === locale && "font-semibold text-teal")}>
            {LOCALE_LABELS[l] ?? l}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
