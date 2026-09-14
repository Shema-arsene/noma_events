"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

export function LoadingState({ label }: { label?: string }) {
  const t = useTranslations("common");
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink/60">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-ink/20 border-t-teal" />
      <p className="text-sm">{label ?? t("loading")}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const t = useTranslations("common");
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-danger/20 bg-danger-soft px-6 py-12 text-center">
      <p className="text-sm font-medium text-danger">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="focus-ring rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-danger-dark">
          {t("retry")}
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations("common");
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-ink/15 bg-white/60 px-6 py-16 text-center", className)}>
      <p className="text-base font-medium text-ink">{title ?? t("noEventsFound")}</p>
      {description && <p className="max-w-sm text-sm text-ink/60">{description}</p>}
      {action}
    </div>
  );
}
