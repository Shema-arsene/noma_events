"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import type { CategoryDTO, EventDTO } from "@/types";
import { GABON_CITIES } from "@/types";
import { apiGet } from "@/lib/api";
import { EventCard, EventCardSkeleton } from "@/components/EventCard";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Input";
import { useRouter } from "@/i18n/navigation";

function whenToRange(when: string | null): { dateFrom?: string; dateTo?: string } {
  if (!when) return {};
  const now = new Date();
  if (when === "today") {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { dateFrom: now.toISOString(), dateTo: end.toISOString() };
  }
  if (when === "weekend") {
    const day = now.getDay();
    const daysUntilSaturday = (6 - day + 7) % 7;
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + daysUntilSaturday);
    saturday.setHours(0, 0, 0, 0);
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    sunday.setHours(23, 59, 59, 999);
    return { dateFrom: now.toISOString(), dateTo: sunday.toISOString() };
  }
  if (when === "month") {
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { dateFrom: now.toISOString(), dateTo: end.toISOString() };
  }
  return {};
}

export function EventsBrowser() {
  const t = useTranslations("eventsBrowser");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);

  const q = searchParams.get("q") ?? "";
  const [qInput, setQInput] = useState(q);
  const city = searchParams.get("city") ?? "";
  const category = searchParams.get("category") ?? "";
  const free = searchParams.get("free") ?? "";
  const when = searchParams.get("when");
  const sort = searchParams.get("sort") ?? "date";

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await apiGet<CategoryDTO[]>("/categories", { auth: false })).data,
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (city) params.set("city", city);
    if (category) params.set("category", category);
    if (free) params.set("free", free);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "12");
    const range = whenToRange(when);
    if (range.dateFrom) params.set("dateFrom", range.dateFrom);
    if (range.dateTo) params.set("dateTo", range.dateTo);
    return params.toString();
  }, [q, city, category, free, sort, when, page]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["events", queryString],
    queryFn: async () => apiGet<EventDTO[]>(`/events?${queryString}`, { auth: false }),
  });

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      setPage(1);
      router.replace(`/events?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    updateFilter("q", qInput.trim());
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-3 rounded-card border border-ink/10 bg-white p-4">
        <form onSubmit={handleSearchSubmit} className="focus-within:ring-2 focus-within:ring-teal/40 flex w-full items-center gap-2 rounded-lg border border-ink/15 px-3 sm:w-64">
          <Search className="h-4 w-4 shrink-0 text-ink/40" />
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full py-2.5 text-sm text-ink outline-none placeholder:text-ink/40"
          />
          {qInput && (
            <button
              type="button"
              onClick={() => {
                setQInput("");
                updateFilter("q", "");
              }}
              className="focus-ring rounded p-0.5 text-ink/30 hover:text-ink"
              aria-label={t("clearSearch")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>
        <Select value={city} onChange={(e) => updateFilter("city", e.target.value)} className="w-auto min-w-[160px]">
          <option value="">{t("allCities")}</option>
          {GABON_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select value={category} onChange={(e) => updateFilter("category", e.target.value)} className="w-auto min-w-[160px]">
          <option value="">{t("allCategories")}</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={free} onChange={(e) => updateFilter("free", e.target.value)} className="w-auto min-w-[140px]">
          <option value="">{t("paidAndFree")}</option>
          <option value="true">{t("free")}</option>
          <option value="false">{t("paid")}</option>
        </Select>
        <Select value={sort} onChange={(e) => updateFilter("sort", e.target.value)} className="w-auto min-w-[140px]">
          <option value="date">{t("sortDate")}</option>
          <option value="newest">{t("sortNewest")}</option>
          <option value="popularity">{t("sortPopularity")}</option>
        </Select>
        {(city || category || free || when || q) && (
          <button
            onClick={() => {
              setPage(1);
              setQInput("");
              router.replace("/events", { scroll: false });
            }}
            className="focus-ring ml-auto rounded-lg px-3 py-2 text-sm font-medium text-teal hover:underline"
          >
            {t("reset")}
          </button>
        )}
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={t("loadError")} onRetry={() => refetch()} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState description={t("adjustFilters")} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {data.data.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            {data.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}
          </>
        )}
      </div>
    </div>
  );
}
