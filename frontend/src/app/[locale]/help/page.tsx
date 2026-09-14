import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FaqAccordion } from "@/components/FaqAccordion";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "help" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

interface FaqItem {
  id?: string;
  q: string;
  a: string;
}

export default async function HelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("help");
  const items = t.raw("items") as FaqItem[];

  return (
    <div className="container-page max-w-2xl py-12">
      <h1 className="font-display text-3xl font-bold text-ink">{t("title")}</h1>
      <FaqAccordion items={items} />
    </div>
  );
}
