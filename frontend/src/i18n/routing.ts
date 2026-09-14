import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "always",
  // French is the site's true default. Without this, next-intl auto-detects
  // a locale from the browser's Accept-Language header (and a past
  // NEXT_LOCALE cookie) on any unprefixed visit — a browser set to English
  // would land on /en instead of /fr. Once a visitor is on a locale-prefixed
  // page, internal navigation (the Link/useRouter from @/i18n/navigation)
  // always keeps them on that same locale regardless of this setting; it
  // only affects what a *fresh, unprefixed* visit resolves to.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
