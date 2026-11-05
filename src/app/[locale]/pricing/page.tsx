import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalizedPricingPage } from "@/src/app/pricing/localized-pricing-page";
import { createPricingMetadata } from "@/src/i18n/pricing-metadata";
import {
  DEFAULT_LOCALE,
  PRICING_LOCALES,
  isPricingLocale,
  type PricingLocale,
} from "@/src/i18n/locales";

export const dynamicParams = false;

type LocalizedPricingPageRouteProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return PRICING_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).map((locale) => ({
    locale,
  }));
}

async function resolveLocale(
  params: LocalizedPricingPageRouteProps["params"],
): Promise<PricingLocale> {
  const { locale } = await params;

  if (!isPricingLocale(locale) || locale === DEFAULT_LOCALE) {
    notFound();
  }

  return locale;
}

export async function generateMetadata({
  params,
}: LocalizedPricingPageRouteProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return createPricingMetadata(locale);
}

export default async function LocalePricingPage({
  params,
}: LocalizedPricingPageRouteProps) {
  const locale = await resolveLocale(params);
  return <LocalizedPricingPage locale={locale} />;
}
