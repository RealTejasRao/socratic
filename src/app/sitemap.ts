import type { MetadataRoute } from "next";
import fs from "node:fs";
import path from "node:path";
import { absoluteUrl } from "@/src/lib/seo";
import { getBlogPostSitemapEntries } from "@/src/server/blog/posts";

type SitemapEntry = MetadataRoute.Sitemap[number];

const publicStaticRoutes: Array<{
  path: string;
  filePath: string;
  changeFrequency: SitemapEntry["changeFrequency"];
  priority: number;
}> = [
  { path: "/", filePath: "src/app/page.tsx", changeFrequency: "weekly", priority: 1 },
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

  const dynamicEntries: MetadataRoute.Sitemap = blogEntries.map((entry) => ({
    url: absoluteUrl(`/blog/${entry.slug}`),
    lastModified: entry.lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticEntries, ...dynamicEntries];
}
