import type { Metadata } from "next";
import { getPricingCopy } from "@/src/i18n/pricing";
import {
  LOCALE_OG_LOCALES,
  SUPPORTED_LOCALES,
  getLocalizedPath,
  type SupportedLocale,
} from "@/src/i18n/locales";
import { absoluteUrl, seoConfig } from "@/src/lib/seo";

function getPricingLanguageAlternates() {
  return Object.fromEntries([
    ...SUPPORTED_LOCALES.map((locale) => [
      locale,
      absoluteUrl(getLocalizedPath("/pricing", locale)),
    ]),
    ["x-default", absoluteUrl("/pricing")],
  ]);
}

export function createPricingMetadata(locale: SupportedLocale): Metadata {
  const copy = getPricingCopy(locale);
  const path = getLocalizedPath("/pricing", locale);
  const canonical = absoluteUrl(path);
  const fullTitle = `Socratic AI | ${copy.metadata.title}`;

  return {
    metadataBase: new URL(seoConfig.siteUrl),
    title: { absolute: fullTitle },
    description: copy.metadata.description,
    keywords: [...seoConfig.keywords],
    alternates: {
      canonical,
      languages: getPricingLanguageAlternates(),
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: LOCALE_OG_LOCALES[locale],
      siteName: seoConfig.siteName,
      url: canonical,
      title: fullTitle,
      description: copy.metadata.description,
      images: [
        {
          url: "/home/hero.webp",
          width: 1200,
          height: 630,
          alt: copy.metadata.ogAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: copy.metadata.description,
      images: ["/home/hero.webp"],
    },
  };
}
