import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalizedBillingPage, type BillingPageSearchParams } from "@/src/app/billing/localized-billing-page";
import { createBillingMetadata } from "@/src/i18n/billing-metadata";
import {
  DEFAULT_LOCALE,
  BILLING_LOCALES,
  isBillingLocale,
  type BillingLocale,
} from "@/src/i18n/locales";

export const dynamicParams = false;

type LocalizedBillingPageRouteProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams?: BillingPageSearchParams;
};

export function generateStaticParams() {
  return BILLING_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).map((locale) => ({
    locale,
  }));
}

async function resolveLocale(
  params: LocalizedBillingPageRouteProps["params"],
): Promise<BillingLocale> {
  const { locale } = await params;

  if (!isBillingLocale(locale) || locale === DEFAULT_LOCALE) {
    notFound();
  }

  return locale;
}

export async function generateMetadata({
  params,
}: LocalizedBillingPageRouteProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return createBillingMetadata(locale);
}

export default async function LocaleBillingPage({
  params,
  searchParams,
}: LocalizedBillingPageRouteProps) {
  const locale = await resolveLocale(params);
  return <LocalizedBillingPage locale={locale} searchParams={searchParams} />;
}
