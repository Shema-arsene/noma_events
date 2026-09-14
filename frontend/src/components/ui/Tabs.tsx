"use client";

import * as RadixTabs from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";

export const Tabs = RadixTabs.Root;

export function TabsList({ children, className, ...props }: React.ComponentPropsWithoutRef<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List className={cn("flex items-center gap-1 overflow-x-auto border-b border-ink/10", className)} {...props}>
      {children}
    </RadixTabs.List>
  );
}

export function TabsTrigger({ children, className, ...props }: React.ComponentPropsWithoutRef<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={cn(
        "focus-ring -mb-px whitespace-nowrap border-b-2 border-transparent px-3.5 py-3 text-sm font-medium text-ink/55 transition-colors hover:text-ink data-[state=active]:border-teal data-[state=active]:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </RadixTabs.Trigger>
  );
}

export function TabsContent({ children, className, ...props }: React.ComponentPropsWithoutRef<typeof RadixTabs.Content>) {
  return (
    <RadixTabs.Content className={cn("focus-ring outline-none", className)} {...props}>
      {children}
    </RadixTabs.Content>
  );
}
