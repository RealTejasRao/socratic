import type { Metadata } from "next";
import { getBillingCopy } from "@/src/i18n/billing";
import { getLocalizedPath, LOCALE_OG_LOCALES, type BillingLocale } from "@/src/i18n/locales";
import { createPageMetadata } from "@/src/lib/seo";

export function createBillingMetadata(locale: BillingLocale): Metadata {
  const copy = getBillingCopy(locale);
  const metadata = createPageMetadata({
    title: copy.metadata.title,
    description: copy.metadata.description,
    path: getLocalizedPath("/billing", locale),
    index: false,
  });

  return {
    ...metadata,
    openGraph: { ...metadata.openGraph, locale: LOCALE_OG_LOCALES[locale] },
  };
}
