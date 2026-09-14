"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

export function DialogContent({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixDialog.Content>) {
  const t = useTranslations("common");
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="animate-overlay fixed inset-0 z-50 bg-ink/40" />
      <RadixDialog.Content
        className={cn(
          "animate-content fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card bg-white p-6 shadow-popover focus:outline-none",
          className,
        )}
        {...props}
      >
        {children}
        <RadixDialog.Close className="focus-ring absolute right-4 top-4 rounded-full p-1 text-ink/40 hover:bg-ink/5 hover:text-ink">
          <X className="h-4 w-4" />
          <span className="sr-only">{t("close")}</span>
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-4 pr-6", className)}>{children}</div>;
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <RadixDialog.Title className={cn("font-display text-lg font-semibold text-ink", className)}>
      {children}
    </RadixDialog.Title>
  );
}

export function DialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <RadixDialog.Description className={cn("mt-1.5 text-sm text-ink/60", className)}>{children}</RadixDialog.Description>;
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}>{children}</div>;
}

export const DialogClose = RadixDialog.Close;
