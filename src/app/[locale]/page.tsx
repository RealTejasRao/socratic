import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalizedHomePage } from "@/src/components/home/localized-home-page";
import { createHomeMetadata } from "@/src/i18n/home-metadata";
import {
  SUPPORTED_LOCALES,
  isSupportedLocale,
  type SupportedLocale,
} from "@/src/i18n/locales";

export const dynamicParams = false;

type LocalizedHomePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.filter((locale) => locale !== "en").map((locale) => ({
    locale,
  }));
}

async function resolveLocale(
  params: LocalizedHomePageProps["params"],
): Promise<SupportedLocale> {
  const { locale } = await params;

  if (!isSupportedLocale(locale) || locale === "en") {
    notFound();
  }

  return locale;
}

export async function generateMetadata({
  params,
}: LocalizedHomePageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return createHomeMetadata(locale);
}

export default async function LocaleHomePage({
  params,
}: LocalizedHomePageProps) {
  const locale = await resolveLocale(params);
  return <LocalizedHomePage locale={locale} />;
}
