import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/src/lib/seo";

type SitemapEntry = MetadataRoute.Sitemap[number];

const publicStaticRoutes: Array<{
  path: string;
  changeFrequency: SitemapEntry["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/homepage", changeFrequency: "weekly", priority: 0.9 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
];

async function getDynamicSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  // Extend this for future public dynamic content such as blog posts,
  // docs pages, changelog entries, or public profiles.
  return [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = publicStaticRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const dynamicEntries = await getDynamicSitemapEntries();

  return [...staticEntries, ...dynamicEntries];
}
