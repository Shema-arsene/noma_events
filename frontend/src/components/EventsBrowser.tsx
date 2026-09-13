"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { CategoryDTO, EventDTO } from "@/types";
import { GABON_CITIES } from "@/types";
import { apiGet } from "@/lib/api";
import { EventCard, EventCardSkeleton } from "@/components/EventCard";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Input";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);

  const q = searchParams.get("q") ?? "";
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

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-3 rounded-card border border-ink/10 bg-white p-4">
        <Select value={city} onChange={(e) => updateFilter("city", e.target.value)} className="w-auto min-w-[160px]">
          <option value="">Toutes les villes</option>
          {GABON_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select value={category} onChange={(e) => updateFilter("category", e.target.value)} className="w-auto min-w-[160px]">
          <option value="">Toutes les catégories</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={free} onChange={(e) => updateFilter("free", e.target.value)} className="w-auto min-w-[140px]">
          <option value="">Payant et gratuit</option>
          <option value="true">Gratuit</option>
          <option value="false">Payant</option>
        </Select>
        <Select value={sort} onChange={(e) => updateFilter("sort", e.target.value)} className="w-auto min-w-[140px]">
          <option value="date">Date</option>
          <option value="newest">Plus récent</option>
          <option value="popularity">Popularité</option>
        </Select>
        {(city || category || free || when || q) && (
          <button
            onClick={() => {
              setPage(1);
              router.replace("/events", { scroll: false });
            }}
            className="focus-ring ml-auto rounded-lg px-3 py-2 text-sm font-medium text-teal hover:underline"
          >
            Réinitialiser
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
          <ErrorState message="Impossible de charger les événements." onRetry={() => refetch()} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState description="Essayez d'ajuster vos filtres ou votre recherche." />
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
