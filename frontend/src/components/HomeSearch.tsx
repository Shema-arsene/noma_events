"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

export function HomeSearch() {
  const t = useTranslations("nav");
  const [q, setQ] = useState("");
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/events?q=${encodeURIComponent(q.trim())}` : "/events");
  }

  return (
    <form onSubmit={handleSubmit} className="focus-within:ring-2 focus-within:ring-gold/60 flex overflow-hidden rounded-full bg-white shadow-card">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="w-full flex-1 px-5 py-3.5 text-sm text-ink outline-none"
      />
      <button
        type="submit"
        className="focus-ring flex items-center gap-2 bg-gold px-6 py-3.5 text-sm font-semibold text-ink hover:bg-gold-dark"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">{t("search")}</span>
      </button>
    </form>
  );
}
