"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiPost } from "@/lib/api";
import { cn } from "@/lib/cn";

export function FavoriteButton({ eventId, initialFavorited = false }: { eventId: string; initialFavorited?: boolean }) {
  const { user } = useAuth();
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiPost<{ favorited: boolean }>(`/events/${eventId}/favorite`);
      setFavorited(data.favorited);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-pressed={favorited}
      aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={cn(
        "focus-ring flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
        favorited ? "border-gold bg-gold/15 text-gold-dark" : "border-ink/15 bg-white text-ink/60 hover:text-ink",
      )}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={favorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M12 21s-6.7-4.35-9.33-8.1C.6 9.77 1.5 6 5 5c2-.55 3.7.4 4.8 1.7C10.9 5.4 12.6 4.45 14.6 5c3.5 1 4.4 4.77 2.33 7.9C18.7 16.65 12 21 12 21z" />
      </svg>
    </button>
  );
}
