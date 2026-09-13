"use client";

import { cn } from "@/lib/cn";

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <nav className="flex items-center justify-center gap-1.5 py-6" aria-label="Pagination">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="focus-ring rounded-lg px-3 py-2 text-sm text-ink/70 hover:bg-sand disabled:opacity-30"
      >
        Précédent
      </button>
      {pages.map((p, i) => (
        <div key={p} className="flex items-center gap-1.5">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="text-ink/30">…</span>}
          <button
            onClick={() => onChange(p)}
            className={cn(
              "focus-ring h-9 w-9 rounded-lg text-sm font-medium",
              p === page ? "bg-ink text-white" : "text-ink/70 hover:bg-sand",
            )}
          >
            {p}
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="focus-ring rounded-lg px-3 py-2 text-sm text-ink/70 hover:bg-sand disabled:opacity-30"
      >
        Suivant
      </button>
    </nav>
  );
}
