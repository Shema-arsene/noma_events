"use client";

import * as RadixDropdown from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/cn";

export const DropdownMenu = RadixDropdown.Root;
export const DropdownMenuTrigger = RadixDropdown.Trigger;

export function DropdownMenuContent({
  children,
  className,
  align = "end",
  sideOffset = 8,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixDropdown.Content>) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "animate-content z-50 min-w-[12rem] rounded-xl border border-ink/10 bg-white p-1.5 shadow-popover focus:outline-none",
          className,
        )}
        {...props}
      >
        {children}
      </RadixDropdown.Content>
    </RadixDropdown.Portal>
  );
}

export function DropdownMenuItem({
  children,
  className,
  danger,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixDropdown.Item> & { danger?: boolean }) {
  return (
    <RadixDropdown.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors data-[highlighted]:bg-ivory",
        danger && "text-danger data-[highlighted]:bg-danger-soft",
        className,
      )}
      {...props}
    >
      {children}
    </RadixDropdown.Item>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <RadixDropdown.Separator className={cn("my-1 h-px bg-ink/8", className)} />;
}

export function DropdownMenuLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <RadixDropdown.Label className={cn("px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-ink/40", className)}>{children}</RadixDropdown.Label>;
}
