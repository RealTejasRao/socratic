import enBilling from "@/src/i18n/messages/en/billing.json";
import itBilling from "@/src/i18n/messages/it/billing.json";
import frBilling from "@/src/i18n/messages/fr/billing.json";
import deBilling from "@/src/i18n/messages/de/billing.json";
import ptBrBilling from "@/src/i18n/messages/pt-BR/billing.json";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@/src/i18n/locales";

export type BillingCopy = typeof enBilling;

const BILLING_COPY_BY_LOCALE = {
  en: enBilling,
  it: itBilling,
  fr: frBilling,
  de: deBilling,
  "pt-BR": ptBrBilling,
} satisfies Record<SupportedLocale, BillingCopy>;

export function getBillingCopy(locale: SupportedLocale): BillingCopy {
  return BILLING_COPY_BY_LOCALE[locale] ?? BILLING_COPY_BY_LOCALE[DEFAULT_LOCALE];
}
