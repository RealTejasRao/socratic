import enPricing from "@/src/i18n/messages/en/pricing.json";
import itPricing from "@/src/i18n/messages/it/pricing.json";
import frPricing from "@/src/i18n/messages/fr/pricing.json";
import dePricing from "@/src/i18n/messages/de/pricing.json";
import ptBrPricing from "@/src/i18n/messages/pt-BR/pricing.json";
import ruPricing from "@/src/i18n/messages/ru/pricing.json";
import arPricing from "@/src/i18n/messages/ar/pricing.json";
import {
  DEFAULT_LOCALE,
  type PricingLocale,
} from "@/src/i18n/locales";

export type PricingCopy = typeof enPricing;

const PRICING_COPY_BY_LOCALE = {
  en: enPricing,
  it: itPricing,
  fr: frPricing,
  de: dePricing,
  "pt-BR": ptBrPricing,
  ru: ruPricing,
  ar: arPricing,
} satisfies Record<PricingLocale, PricingCopy>;

export function getPricingCopy(locale: PricingLocale): PricingCopy {
  return PRICING_COPY_BY_LOCALE[locale] ?? PRICING_COPY_BY_LOCALE[DEFAULT_LOCALE];
}
