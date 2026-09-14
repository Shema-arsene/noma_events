import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-display text-6xl font-bold text-gold">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink">{t("title")}</h1>
      <p className="mt-2 max-w-sm text-ink/60">{t("description")}</p>
      <Link href="/" className="focus-ring mt-6 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-white">
        {t("backHome")}
      </Link>
    </div>
  );
}
