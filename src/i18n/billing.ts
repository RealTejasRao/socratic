import enBilling from "@/src/i18n/messages/en/billing.json";
import itBilling from "@/src/i18n/messages/it/billing.json";
import frBilling from "@/src/i18n/messages/fr/billing.json";
import deBilling from "@/src/i18n/messages/de/billing.json";
import ptBrBilling from "@/src/i18n/messages/pt-BR/billing.json";
import ruBilling from "@/src/i18n/messages/ru/billing.json";
import arBilling from "@/src/i18n/messages/ar/billing.json";
import {
  DEFAULT_LOCALE,
  type BillingLocale,
} from "@/src/i18n/locales";

export type BillingCopy = typeof enBilling;

const BILLING_COPY_BY_LOCALE = {
  en: enBilling,
  it: itBilling,
  fr: frBilling,
  de: deBilling,
  "pt-BR": ptBrBilling,
  ru: ruBilling,
  ar: arBilling,
} satisfies Record<BillingLocale, BillingCopy>;

export function getBillingCopy(locale: BillingLocale): BillingCopy {
  return BILLING_COPY_BY_LOCALE[locale] ?? BILLING_COPY_BY_LOCALE[DEFAULT_LOCALE];
}
