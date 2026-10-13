import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalizedBillingPage, type BillingPageSearchParams } from "@/src/app/billing/localized-billing-page";
import { getBillingCopy } from "@/src/i18n/billing";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  getLocalizedPath,
  isSupportedLocale,
  type SupportedLocale,
} from "@/src/i18n/locales";
import { createPageMetadata } from "@/src/lib/seo";

export const dynamicParams = false;

type LocalizedBillingPageRouteProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams?: BillingPageSearchParams;
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).map((locale) => ({
    locale,
  }));
}

async function resolveLocale(
  params: LocalizedBillingPageRouteProps["params"],
): Promise<SupportedLocale> {
  const { locale } = await params;

  if (!isSupportedLocale(locale) || locale === DEFAULT_LOCALE) {
    notFound();
  }

  return locale;
}

export async function generateMetadata({
  params,
}: LocalizedBillingPageRouteProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const copy = getBillingCopy(locale);

  return createPageMetadata({
    title: copy.metadata.title,
    description: copy.metadata.description,
    path: getLocalizedPath("/billing", locale),
  });
}

export default async function LocaleBillingPage({
  params,
  searchParams,
}: LocalizedBillingPageRouteProps) {
  const locale = await resolveLocale(params);
  return <LocalizedBillingPage locale={locale} searchParams={searchParams} />;
}
