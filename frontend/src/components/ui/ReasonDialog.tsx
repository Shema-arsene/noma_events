"use client";

import { createContext, useContext, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Textarea, Label } from "@/components/ui/Input";

interface ReasonOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: "default" | "danger";
}

/** Result is null if cancelled, otherwise the (possibly empty) reason text entered. */
type PromptFn = (options: ReasonOptions) => Promise<string | null>;

const ReasonContext = createContext<PromptFn | null>(null);

export function useReasonPrompt(): PromptFn {
  const prompt = useContext(ReasonContext);
  if (!prompt) throw new Error("useReasonPrompt must be used within a ReasonDialogProvider");
  return prompt;
}

export function ReasonDialogProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("common");
  const tReason = useTranslations("reasonDialog");
  const [options, setOptions] = useState<ReasonOptions | null>(null);
  const [reason, setReason] = useState("");
  const resolveRef = useRef<(value: string | null) => void>(null);

  const prompt: PromptFn = (opts) => {
    setOptions(opts);
    setReason("");
    return new Promise<string | null>((resolve) => {
      resolveRef.current = resolve;
    });
  };

  function settle(result: string | null) {
    resolveRef.current?.(result);
    setOptions(null);
  }

  return (
    <ReasonContext.Provider value={prompt}>
      {children}
      <Dialog open={options !== null} onOpenChange={(open) => !open && settle(null)}>
        <DialogContent>
          {options && (
            <>
              <DialogHeader>
                <DialogTitle>{options.title}</DialogTitle>
                {options.description && <DialogDescription>{options.description}</DialogDescription>}
              </DialogHeader>
              <div>
                <Label htmlFor="reason">{tReason("reasonLabel")}</Label>
                <Textarea id="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => settle(null)}>
                  {t("cancel")}
                </Button>
                <Button variant={options.tone === "danger" ? "danger" : "primary"} onClick={() => settle(reason.trim())}>
                  {options.confirmLabel ?? t("confirm")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </ReasonContext.Provider>
  );
}
