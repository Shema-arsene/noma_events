"use client";

import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

export function FaqAccordion({ items }: { items: { id?: string; q: string; a: string }[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash || !containerRef.current) return;
    const target = containerRef.current.querySelector<HTMLDetailsElement>(`#${CSS.escape(hash)}`);
    if (target) {
      target.open = true;
      target.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }, []);

  return (
    <div ref={containerRef} className="mt-8 divide-y divide-ink/10 rounded-card border border-ink/10 bg-white">
      {items.map((item, i) => (
        <details key={item.q} id={item.id} className="group px-5 py-4 open:pb-5" open={i === 0}>
          <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink marker:content-none">
            {item.q}
            <ChevronDown className="h-4 w-4 shrink-0 text-ink/40 transition-transform group-open:rotate-180" />
          </summary>
          <p className="mt-2 text-sm leading-relaxed text-ink/70">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
