import enApp from "@/src/i18n/messages/en/app.json";
import itApp from "@/src/i18n/messages/it/app.json";
import frApp from "@/src/i18n/messages/fr/app.json";
import deApp from "@/src/i18n/messages/de/app.json";
import ptBrApp from "@/src/i18n/messages/pt-BR/app.json";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@/src/i18n/locales";

export type AppCopy = typeof enApp;

const APP_COPY_BY_LOCALE = {
  en: enApp,
  it: itApp,
  fr: frApp,
  de: deApp,
  "pt-BR": ptBrApp,
} satisfies Record<SupportedLocale, AppCopy>;

export function getAppCopy(locale: SupportedLocale): AppCopy {
  return APP_COPY_BY_LOCALE[locale] ?? APP_COPY_BY_LOCALE[DEFAULT_LOCALE];
}
