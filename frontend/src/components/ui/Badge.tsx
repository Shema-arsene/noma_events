import { cn } from "@/lib/cn";

type Tone = "neutral" | "gold" | "teal" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-sand text-ink/70",
  gold: "bg-gold/15 text-gold-dark",
  teal: "bg-teal/10 text-teal-dark",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-700",
};

export function Badge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", toneClasses[tone], className)}>
      {children}
    </span>
  );
}
