import { useTranslations } from "next-intl";
import { CalendarCheck, QrCode, ShieldCheck } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const t = useTranslations("authShell");

  const FEATURES = [
    { icon: CalendarCheck, text: t("feature1") },
    { icon: QrCode, text: t("feature2") },
    { icon: ShieldCheck, text: t("feature3") },
  ];

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink px-12 py-14 text-ivory lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-gold/20" />
        <div className="absolute -right-8 top-32 h-40 w-40 rounded-full border border-gold/15" />
        <div className="absolute bottom-0 left-0 h-56 w-56 -translate-x-1/3 translate-y-1/3 rounded-full bg-teal/20 blur-3xl" />

        <div className="relative flex items-center gap-2 font-display text-xl font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-ink">N</span>
          Noma<span className="text-gold-light">Events</span>
        </div>

        <div className="relative max-w-sm">
          <p className="font-display text-3xl font-bold leading-tight">{t("headline")}</p>
          <p className="mt-3 text-sm text-ivory/60">{t("subheadline")}</p>
          <ul className="mt-8 space-y-4">
            {FEATURES.map((feature) => (
              <li key={feature.text} className="flex items-start gap-3 text-sm text-ivory/80">
                <feature.icon className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" />
                {feature.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-ivory/40">{t("copyright", { year: new Date().getFullYear() })}</p>
      </div>

      <div className="container-page flex items-center justify-center py-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink/60">{subtitle}</p>
          <div className="mt-7">{children}</div>
          <p className="mt-6 text-center text-sm text-ink/60">{footer}</p>
        </div>
      </div>
    </div>
  );
}
