"use client";

import * as RadixTooltip from "@radix-ui/react-tooltip";
import { cn } from "@/lib/cn";

export const TooltipProvider = RadixTooltip.Provider;
export const Tooltip = RadixTooltip.Root;
export const TooltipTrigger = RadixTooltip.Trigger;

export function TooltipContent({
  children,
  className,
  sideOffset = 6,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixTooltip.Content>) {
  return (
    <RadixTooltip.Portal>
      <RadixTooltip.Content
        sideOffset={sideOffset}
        className={cn(
          "animate-content z-50 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-white shadow-popover",
          className,
        )}
        {...props}
      >
        {children}
        <RadixTooltip.Arrow className="fill-ink" />
      </RadixTooltip.Content>
    </RadixTooltip.Portal>
  );
}
