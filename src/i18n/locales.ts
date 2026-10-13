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

export type LocaleDirection = "ltr" | "rtl";

export const LOCALE_COOKIE_NAME = "socratic_locale";
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: "English",
  it: "Italiano",
  fr: "Français",
  de: "Deutsch",
  "pt-BR": "Português",
};

export const LOCALE_NATIVE_LABELS: Record<SupportedLocale, string> = {
  en: "English",
  it: "Italiano",
  fr: "Français",
  de: "Deutsch",
  "pt-BR": "Português",
};

export const LOCALE_DIRECTIONS: Record<SupportedLocale, LocaleDirection> = {
  en: "ltr",
  it: "ltr",
  fr: "ltr",
  de: "ltr",
  "pt-BR": "ltr",
};

export const LOCALE_OG_LOCALES: Record<SupportedLocale, string> = {
  en: "en_US",
  it: "it_IT",
  fr: "fr_FR",
  de: "de_DE",
  "pt-BR": "pt_BR",
};

const LOCALE_SET = new Set<string>(SUPPORTED_LOCALES);

export function isSupportedLocale(value: string | undefined): value is SupportedLocale {
  return Boolean(value && LOCALE_SET.has(value));
}

export function normalizeLocale(value: string | undefined): SupportedLocale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}

export function getLocaleFromPathname(pathname: string): SupportedLocale {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return normalizeLocale(firstSegment);
}

export function getHomePathForLocale(locale: SupportedLocale): Route {
  return (locale === DEFAULT_LOCALE ? "/" : `/${locale}`) as Route;
}

export function getLocalizedPath(path: string, locale: SupportedLocale): Route {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const cleanedPath =
    normalizedPath.length > 1 && normalizedPath.endsWith("/")
      ? normalizedPath.slice(0, -1)
      : normalizedPath;

  if (locale === DEFAULT_LOCALE) {
    return cleanedPath as Route;
  }

  return `${getHomePathForLocale(locale)}${cleanedPath === "/" ? "" : cleanedPath}` as Route;
}

export function getHomepageLanguageAlternates() {
  return Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [
      locale,
      getHomePathForLocale(locale),
    ]),
  ) as Record<SupportedLocale, Route>;
}

export function getLanguageAlternatesForPath(path: string) {
  return Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [
      locale,
      getLocalizedPath(path, locale),
    ]),
  ) as Record<SupportedLocale, Route>;
}
