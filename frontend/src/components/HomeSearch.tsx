"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function HomeSearch() {
  const [q, setQ] = useState("");
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/events?q=${encodeURIComponent(q.trim())}` : "/events");
  }

  return (
    <form onSubmit={handleSubmit} className="flex overflow-hidden rounded-full bg-white shadow-card">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher un événement, un organisateur..."
        className="w-full flex-1 px-5 py-3.5 text-sm text-ink outline-none"
      />
      <button type="submit" className="focus-ring bg-gold px-6 py-3.5 text-sm font-semibold text-ink hover:bg-gold-dark">
        Rechercher
      </button>
    </form>
  );
}
