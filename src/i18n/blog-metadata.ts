import type { Metadata } from "next";
import { getBlogCopy } from "@/src/i18n/blog";
import {
  LOCALE_OG_LOCALES,
  SUPPORTED_LOCALES,
  getLocalizedPath,
  type SupportedLocale,
} from "@/src/i18n/locales";
import { absoluteUrl, seoConfig } from "@/src/lib/seo";

function getBlogLanguageAlternates() {
  return Object.fromEntries([
    ...SUPPORTED_LOCALES.map((locale) => [
      locale,
      absoluteUrl(getLocalizedPath("/blog", locale)),
    ]),
    ["x-default", absoluteUrl("/blog")],
  ]);
}

export function createBlogMetadata(locale: SupportedLocale): Metadata {
  const copy = getBlogCopy(locale);
  const path = getLocalizedPath("/blog", locale);
  const canonical = absoluteUrl(path);

  return {
    metadataBase: new URL(seoConfig.siteUrl),
    title: { absolute: copy.metadata.title },
    description: copy.metadata.description,
    keywords: [
      "Socratic AI blog",
      "philosophy essays",
      "strategy essays",
      "deep thinking blog",
      "Socratic dialogue writing",
    ],
    alternates: {
      canonical,
      languages: getBlogLanguageAlternates(),
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
          url: "/blog/blog_hero.webp",
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
      images: ["/blog/blog_hero.webp"],
    },
  };
}
