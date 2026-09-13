import { cn } from "@/lib/cn";

export function LoadingState({ label = "Chargement..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink/60">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-ink/20 border-t-teal" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-red-200 bg-red-50 px-6 py-12 text-center">
      <p className="text-sm font-medium text-red-700">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="focus-ring rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white">
          Réessayer
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title = "Aucun événement trouvé pour le moment.",
  description,
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-ink/15 bg-white/60 px-6 py-16 text-center", className)}>
      <p className="text-base font-medium text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink/60">{description}</p>}
      {action}
    </div>
  );
}
