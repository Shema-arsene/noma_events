import { Suspense } from "react";
import type { Metadata } from "next";
import { EventsBrowser } from "@/components/EventsBrowser";
import { LoadingState } from "@/components/ui/States";

export const metadata: Metadata = {
  title: "Découvrir les événements",
  description: "Parcourez tous les événements à venir au Gabon : concerts, festivals, culture, sport et plus.",
};

export default function EventsPage() {
  return (
    <div className="container-page py-8">
      <h1 className="font-display text-3xl font-bold text-ink">Découvrir</h1>
      <p className="mt-1 text-ink/60">Trouvez votre prochain événement au Gabon.</p>
      <Suspense fallback={<LoadingState />}>
        <EventsBrowser />
      </Suspense>
    </div>
  );
}
