import type { Route } from "next";

export const DEFAULT_LOCALE = "en";

export const SUPPORTED_LOCALES = [
  "en",
  "it",
  "fr",
  "de",
  "pt-BR",
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

// New languages are published per page as their translations become available.
export const HOME_LOCALES = [...SUPPORTED_LOCALES, "ru", "ar"] as const;
export type HomeLocale = (typeof HOME_LOCALES)[number];
export const PRICING_LOCALES = [...SUPPORTED_LOCALES, "ru", "ar"] as const;
export type PricingLocale = (typeof PRICING_LOCALES)[number];
export const BILLING_LOCALES = [...SUPPORTED_LOCALES, "ru", "ar"] as const;
export type BillingLocale = (typeof BILLING_LOCALES)[number];
export const BLOG_LOCALES = [...SUPPORTED_LOCALES, "ru", "ar"] as const;
export type BlogLocale = (typeof BLOG_LOCALES)[number];
export const BLOG_POST_LOCALES = [...SUPPORTED_LOCALES, "ru", "ar"] as const;
export type BlogPostLocale = (typeof BLOG_POST_LOCALES)[number];

export type LocaleDirection = "ltr" | "rtl";

export const LOCALE_COOKIE_NAME = "socratic_locale";
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const LOCALE_LABELS: Record<HomeLocale, string> = {
  en: "English",
  it: "Italiano",
  fr: "Français",
  de: "Deutsch",
  "pt-BR": "Português",
  ru: "Русский",
  ar: "العربية",
};

export const LOCALE_NATIVE_LABELS: Record<HomeLocale, string> = {
  en: "English",
  it: "Italiano",
  fr: "Français",
  de: "Deutsch",
  "pt-BR": "Português",
  ru: "Русский",
  ar: "العربية",
};

export const LOCALE_DIRECTIONS: Record<HomeLocale, LocaleDirection> = {
  en: "ltr",
  it: "ltr",
  fr: "ltr",
  de: "ltr",
  "pt-BR": "ltr",
  ru: "ltr",
  ar: "rtl",
};

export const LOCALE_OG_LOCALES: Record<HomeLocale, string> = {
  en: "en_US",
  it: "it_IT",
  fr: "fr_FR",
  de: "de_DE",
  "pt-BR": "pt_BR",
  ru: "ru_RU",
  ar: "ar_AR",
};

const LOCALE_SET = new Set<string>(SUPPORTED_LOCALES);
const HOME_LOCALE_SET = new Set<string>(HOME_LOCALES);

export function isHomeLocale(value: string | undefined): value is HomeLocale {
  return Boolean(value && HOME_LOCALE_SET.has(value));
}

export function normalizeHomeLocale(value: string | undefined): HomeLocale {
  return isHomeLocale(value) ? value : DEFAULT_LOCALE;
}

export function isSupportedLocale(value: string | undefined): value is SupportedLocale {
  return Boolean(value && LOCALE_SET.has(value));
}

export function normalizeLocale(value: string | undefined): SupportedLocale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}

export function isPricingLocale(value: string | undefined): value is PricingLocale {
  return Boolean(value && (PRICING_LOCALES as readonly string[]).includes(value));
}

export function isBillingLocale(value: string | undefined): value is BillingLocale {
  return Boolean(value && (BILLING_LOCALES as readonly string[]).includes(value));
}

export function isBlogLocale(value: string | undefined): value is BlogLocale {
  return Boolean(value && (BLOG_LOCALES as readonly string[]).includes(value));
}

export function isBlogPostLocale(value: string | undefined): value is BlogPostLocale {
  return Boolean(value && (BLOG_POST_LOCALES as readonly string[]).includes(value));
}

export function getAvailableLocalesForPath(path: string): readonly HomeLocale[] {
  const pathname = path.replace(/\/$/, "") || "/";
  if (pathname === "/") return HOME_LOCALES;
  if (pathname === "/pricing") return PRICING_LOCALES;
  if (pathname === "/billing") return BILLING_LOCALES;
  if (pathname === "/blog") return BLOG_LOCALES;
  if (/^\/blog\/[^/]+$/.test(pathname)) return BLOG_POST_LOCALES;
  return SUPPORTED_LOCALES;
}

export function getLocaleFromPathname(pathname: string): HomeLocale {
  const segments = pathname.split("/").filter(Boolean);
  const locale = normalizeHomeLocale(segments[0]);
  const path = `/${segments.slice(1).join("/")}`;
  return getAvailableLocalesForPath(path).includes(locale) ? locale : DEFAULT_LOCALE;
}

export function getHomePathForLocale(locale: HomeLocale): Route {
  return (locale === DEFAULT_LOCALE ? "/" : `/${locale}`) as Route;
}

export function getLocalizedPath(path: string, locale: HomeLocale): Route {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const cleanedPath =
    normalizedPath.length > 1 && normalizedPath.endsWith("/")
      ? normalizedPath.slice(0, -1)
      : normalizedPath;

  if (locale === DEFAULT_LOCALE || !getAvailableLocalesForPath(cleanedPath).includes(locale)) {
    return cleanedPath as Route;
  }

  return `${getHomePathForLocale(locale)}${cleanedPath === "/" ? "" : cleanedPath}` as Route;
}

export function getHomepageLanguageAlternates() {
  return Object.fromEntries(
    HOME_LOCALES.map((locale) => [
      locale,
      getHomePathForLocale(locale),
    ]),
  ) as Record<HomeLocale, Route>;
}

export function getLanguageAlternatesForPath(path: string) {
  return Object.fromEntries(
    getAvailableLocalesForPath(path).map((locale) => [
      locale,
      getLocalizedPath(path, locale),
    ]),
  );
}
