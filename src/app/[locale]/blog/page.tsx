import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalizedBlogPage, type BlogPageSearchParams } from "@/src/app/blog/localized-blog-page";
import { createBlogMetadata } from "@/src/i18n/blog-metadata";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  type SupportedLocale,
} from "@/src/i18n/locales";

export const dynamicParams = false;

type LocalizedBlogPageRouteProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams?: BlogPageSearchParams;
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).map((locale) => ({
    locale,
  }));
}

async function resolveLocale(
  params: LocalizedBlogPageRouteProps["params"],
): Promise<SupportedLocale> {
  const { locale } = await params;

  if (!isSupportedLocale(locale) || locale === DEFAULT_LOCALE) {
    notFound();
  }

  return locale;
}

export async function generateMetadata({
  params,
}: LocalizedBlogPageRouteProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return createBlogMetadata(locale);
}

export default async function LocaleBlogPage({
  params,
  searchParams,
}: LocalizedBlogPageRouteProps) {
  const locale = await resolveLocale(params);
  return <LocalizedBlogPage locale={locale} searchParams={searchParams} />;
}
