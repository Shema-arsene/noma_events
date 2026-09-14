import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EventsBrowser } from "@/components/EventsBrowser";
import { LoadingState } from "@/components/ui/States";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "eventsPage" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function EventsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("eventsPage");

  return (
    <div className="container-page py-8">
      <h1 className="font-display text-3xl font-bold text-ink">{t("title")}</h1>
      <p className="mt-1 text-ink/60">{t("subtitle")}</p>
      <Suspense fallback={<LoadingState />}>
        <EventsBrowser />
      </Suspense>
    </div>
  );
}
