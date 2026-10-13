import enPricing from "@/src/i18n/messages/en/pricing.json";
import itPricing from "@/src/i18n/messages/it/pricing.json";
import frPricing from "@/src/i18n/messages/fr/pricing.json";
import dePricing from "@/src/i18n/messages/de/pricing.json";
import ptBrPricing from "@/src/i18n/messages/pt-BR/pricing.json";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@/src/i18n/locales";

export type PricingCopy = typeof enPricing;

const PRICING_COPY_BY_LOCALE = {
  en: enPricing,
  it: itPricing,
  fr: frPricing,
  de: dePricing,
  "pt-BR": ptBrPricing,
} satisfies Record<SupportedLocale, PricingCopy>;

export function getPricingCopy(locale: SupportedLocale): PricingCopy {
  return PRICING_COPY_BY_LOCALE[locale] ?? PRICING_COPY_BY_LOCALE[DEFAULT_LOCALE];
}
