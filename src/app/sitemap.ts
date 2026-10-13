import type { MetadataRoute } from "next";
import fs from "node:fs";
import path from "node:path";
import { absoluteUrl } from "@/src/lib/seo";
import {
  getBlogPostSitemapEntries,
  getTranslatedBlogPostSitemapEntries,
} from "@/src/server/blog/posts";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  getHomePathForLocale,
  getLocalizedPath,
} from "@/src/i18n/locales";

type SitemapEntry = MetadataRoute.Sitemap[number];

const publicStaticRoutes: Array<{
  path: string;
  filePath: string;
  changeFrequency: SitemapEntry["changeFrequency"];
  priority: number;
}> = [
  { path: "/", filePath: "src/app/page.tsx", changeFrequency: "weekly", priority: 1 },
  {
    path: "/upsc",
    filePath: "src/app/upsc/page.tsx",
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    path: "/blog",
    filePath: "src/app/blog/page.tsx",
    changeFrequency: "daily",
    priority: 0.9,
  },
  {
    path: "/pricing",
    filePath: "src/app/pricing/page.tsx",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    path: "/cookies",
    filePath: "src/app/cookies/page.tsx",
    changeFrequency: "monthly",
    priority: 0.4,
  },
  {
    path: "/privacy",
    filePath: "src/app/privacy/page.tsx",
    changeFrequency: "monthly",
    priority: 0.4,
  },
  {
    path: "/terms",
    filePath: "src/app/terms/page.tsx",
    changeFrequency: "monthly",
    priority: 0.4,
  },
];

function getFileLastModified(relativePath: string) {
  const absolutePath = path.join(process.cwd(), relativePath);
  return fs.statSync(absolutePath).mtime;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogEntries = getBlogPostSitemapEntries();
  const latestBlogLastModified = blogEntries.reduce<Date | null>((latest, entry) => {
    if (!latest || entry.lastModified > latest) {
      return entry.lastModified;
    }
    return latest;
  }, null);

  const staticEntries: MetadataRoute.Sitemap = publicStaticRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified:
      route.path === "/blog"
        ? (latestBlogLastModified ?? getFileLastModified(route.filePath))
        : getFileLastModified(route.filePath),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
  const localizedHomeEntries: MetadataRoute.Sitemap = SUPPORTED_LOCALES
    .filter((locale) => locale !== DEFAULT_LOCALE)
    .map((locale) => ({
      url: absoluteUrl(getHomePathForLocale(locale)),
      lastModified: getFileLastModified("src/app/page.tsx"),
      changeFrequency: "weekly",
      priority: 0.95,
    }));
  const localizedPricingEntries: MetadataRoute.Sitemap = SUPPORTED_LOCALES
    .filter((locale) => locale !== DEFAULT_LOCALE)
    .map((locale) => ({
      url: absoluteUrl(getLocalizedPath("/pricing", locale)),
      lastModified: getFileLastModified("src/app/pricing/page.tsx"),
      changeFrequency: "weekly",
      priority: 0.75,
    }));
  const localizedBlogEntries: MetadataRoute.Sitemap = SUPPORTED_LOCALES
    .filter((locale) => locale !== DEFAULT_LOCALE)
    .map((locale) => ({
      url: absoluteUrl(getLocalizedPath("/blog", locale)),
      lastModified:
        latestBlogLastModified ?? getFileLastModified("src/app/blog/page.tsx"),
      changeFrequency: "daily",
      priority: 0.85,
    }));

  const dynamicEntries: MetadataRoute.Sitemap = blogEntries.map((entry) => ({
    url: absoluteUrl(`/blog/${entry.slug}`),
    lastModified: entry.lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  const localizedBlogPostEntries: MetadataRoute.Sitemap = SUPPORTED_LOCALES
    .filter((locale) => locale !== DEFAULT_LOCALE)
    .flatMap((locale) =>
      getTranslatedBlogPostSitemapEntries(locale).map((entry) => ({
        url: absoluteUrl(getLocalizedPath(`/blog/${entry.slug}`, locale)),
        lastModified: entry.lastModified,
        changeFrequency: "monthly",
        priority: 0.65,
      })),
    );

  return [
    ...staticEntries,
    ...localizedHomeEntries,
    ...localizedPricingEntries,
    ...localizedBlogEntries,
    ...dynamicEntries,
    ...localizedBlogPostEntries,
  ];
}
