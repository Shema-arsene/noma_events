import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export function Stepper({ steps, activeIndex }: { steps: readonly { label: string }[]; activeIndex: number }) {
  return (
    <ol className="flex items-center">
      {steps.map((s, i) => {
        const state = i < activeIndex ? "done" : i === activeIndex ? "active" : "upcoming";
        return (
          <li key={s.label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  state === "done" && "bg-teal text-white",
                  state === "active" && "bg-ink text-white",
                  state === "upcoming" && "bg-ink/8 text-ink/40",
                )}
              >
                {state === "done" ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn("hidden text-sm font-medium sm:inline", state === "upcoming" ? "text-ink/40" : "text-ink")}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && <span className={cn("mx-3 h-px flex-1", state === "done" ? "bg-teal" : "bg-ink/10")} />}
          </li>
        );
      })}
    </ol>
  );
}
