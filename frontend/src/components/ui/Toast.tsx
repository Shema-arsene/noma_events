"use client";

import { createContext, useCallback, useContext, useState } from "react";
import * as RadixToast from "@radix-ui/react-toast";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: "success" | "danger";
}

type ToastFn = (toast: Omit<ToastItem, "id">) => void;

const ToastContext = createContext<ToastFn | null>(null);

/** Fire-and-forget toast notifications, replacing ad hoc inline success/error paragraphs. */
export function useToast(): ToastFn {
  const push = useContext(ToastContext);
  if (!push) throw new Error("useToast must be used within a ToastProvider");
  return push;
}

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback<ToastFn>((toast) => {
    setToasts((current) => [...current, { ...toast, id: nextId++ }]);
  }, []);

  function remove(id: number) {
    setToasts((current) => current.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={push}>
      <RadixToast.Provider swipeDirection="right" duration={4500}>
        {children}
        {toasts.map((toast) => (
          <RadixToast.Root
            key={toast.id}
            className="animate-toast flex items-start gap-3 rounded-xl bg-ink px-4 py-3.5 text-white shadow-popover data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]"
            onOpenChange={(open) => !open && remove(toast.id)}
          >
            {toast.tone === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-light" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger-soft" />
            )}
            <div className="flex-1">
              <RadixToast.Title className="text-sm font-medium">{toast.title}</RadixToast.Title>
              {toast.description && (
                <RadixToast.Description className="mt-0.5 text-xs text-white/70">{toast.description}</RadixToast.Description>
              )}
            </div>
            <RadixToast.Close className="focus-ring rounded-full p-0.5 text-white/50 hover:text-white">
              <X className="h-4 w-4" />
            </RadixToast.Close>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport
          className={cn(
            "fixed bottom-0 right-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-4 outline-none sm:bottom-4 sm:right-4",
          )}
        />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}
