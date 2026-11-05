import enHome from "@/src/i18n/messages/en/home.json";
import itHome from "@/src/i18n/messages/it/home.json";
import frHome from "@/src/i18n/messages/fr/home.json";
import deHome from "@/src/i18n/messages/de/home.json";
import ptBrHome from "@/src/i18n/messages/pt-BR/home.json";
import ruHome from "@/src/i18n/messages/ru/home.json";
import arHome from "@/src/i18n/messages/ar/home.json";
import {
  DEFAULT_LOCALE,
  type HomeLocale,
} from "@/src/i18n/locales";

export type HomeFeatureCardCopy = {
  id: string;
  title: string;
  description: string;
};

export type HomeUseCaseItemCopy = {
  id: string;
  leftTitle: string;
  leftDescription: string;
  rightTitle: string;
  rightDescription: string;
  placeholderLabel: string;
};

export type HomeCopy = typeof enHome;

const HOME_COPY_BY_LOCALE = {
  en: enHome,
  it: itHome,
  fr: frHome,
  de: deHome,
  "pt-BR": ptBrHome,
  ru: ruHome,
  ar: arHome,
} satisfies Record<HomeLocale, HomeCopy>;

export function getHomeCopy(locale: HomeLocale): HomeCopy {
  return HOME_COPY_BY_LOCALE[locale] ?? HOME_COPY_BY_LOCALE[DEFAULT_LOCALE];
}
