"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

export const Sheet = RadixDialog.Root;
export const SheetTrigger = RadixDialog.Trigger;
export const SheetClose = RadixDialog.Close;

export function SheetContent({
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
          "animate-sheet fixed right-0 top-0 z-50 flex h-dvh w-full max-w-xs flex-col overflow-y-auto bg-white shadow-popover focus:outline-none sm:max-w-sm",
          className,
        )}
        {...props}
      >
        {children}
        <RadixDialog.Close className="focus-ring absolute right-4 top-4 rounded-full p-1.5 text-ink/40 hover:bg-ink/5 hover:text-ink">
          <X className="h-5 w-5" />
          <span className="sr-only">{t("close")}</span>
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export const SheetTitle = RadixDialog.Title;
export const SheetDescription = RadixDialog.Description;
