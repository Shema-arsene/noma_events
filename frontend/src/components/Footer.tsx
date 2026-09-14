import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="mt-16 border-t border-ink/10 bg-ink text-ivory">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-ink">N</span>
            Noma Events
          </div>
          <p className="mt-3 text-sm text-ivory/60">{t("tagline")}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gold">{t("discoverHeading")}</h4>
          <ul className="mt-3 space-y-2 text-sm text-ivory/70">
            <li><Link href="/events" className="hover:text-white">{t("allEvents")}</Link></li>
            <li><Link href="/events?free=true" className="hover:text-white">{t("freeEvents")}</Link></li>
            <li><Link href="/cities/libreville" className="hover:text-white">Libreville</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gold">{t("organizersHeading")}</h4>
          <ul className="mt-3 space-y-2 text-sm text-ivory/70">
            <li><Link href="/organizer" className="hover:text-white">{t("createEvent")}</Link></li>
            <li><Link href="/register" className="hover:text-white">{t("becomeOrganizer")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gold">{t("supportHeading")}</h4>
          <ul className="mt-3 space-y-2 text-sm text-ivory/70">
            <li><Link href="/help" className="hover:text-white">{t("helpFaq")}</Link></li>
            <li><Link href="/help#refund" className="hover:text-white">{t("refunds")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-ivory/50">
        {t("copyright", { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
