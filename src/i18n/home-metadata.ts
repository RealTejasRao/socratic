import type { Metadata } from "next";
import { absoluteUrl, seoConfig } from "@/src/lib/seo";
import { getHomeCopy } from "@/src/i18n/home";
import {
  LOCALE_OG_LOCALES,
  HOME_LOCALES,
  getHomePathForLocale,
  type HomeLocale,
} from "@/src/i18n/locales";

function getLanguageAlternates() {
  return Object.fromEntries([
    ...HOME_LOCALES.map((locale) => [
      locale,
      absoluteUrl(getHomePathForLocale(locale)),
    ]),
    ["x-default", absoluteUrl("/")],
  ]);
}

export function createHomeMetadata(locale: HomeLocale): Metadata {
  const copy = getHomeCopy(locale);
  const path = getHomePathForLocale(locale);
  const canonical = absoluteUrl(path);

  return {
    metadataBase: new URL(seoConfig.siteUrl),
    title: { absolute: copy.metadata.title },
    description: copy.metadata.description,
    keywords: [...seoConfig.keywords],
    alternates: {
      canonical,
      languages: getLanguageAlternates(),
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
      title: copy.metadata.title,
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
      title: copy.metadata.title,
      description: copy.metadata.description,
      images: ["/home/hero.webp"],
    },
  };
}
