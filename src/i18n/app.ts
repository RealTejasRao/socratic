import enApp from "@/src/i18n/messages/en/app.json";
import itApp from "@/src/i18n/messages/it/app.json";
import frApp from "@/src/i18n/messages/fr/app.json";
import deApp from "@/src/i18n/messages/de/app.json";
import ptBrApp from "@/src/i18n/messages/pt-BR/app.json";
import ruApp from "@/src/i18n/messages/ru/app.json";
import arApp from "@/src/i18n/messages/ar/app.json";
import {
  DEFAULT_LOCALE,
  type AppLocale,
} from "@/src/i18n/locales";

export type AppCopy = typeof enApp;

const APP_COPY_BY_LOCALE = {
  en: enApp,
  it: itApp,
  fr: frApp,
  de: deApp,
  "pt-BR": ptBrApp,
  ru: ruApp,
  ar: arApp,
} satisfies Record<AppLocale, AppCopy>;

export function getAppCopy(locale: AppLocale): AppCopy {
  return APP_COPY_BY_LOCALE[locale] ?? APP_COPY_BY_LOCALE[DEFAULT_LOCALE];
}
