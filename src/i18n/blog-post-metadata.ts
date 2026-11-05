import type { Metadata } from "next";
import { getLocalizedPath, LOCALE_OG_LOCALES, type BlogPostLocale } from "@/src/i18n/locales";
import { absoluteUrl, createPageMetadata } from "@/src/lib/seo";
import { getAvailableBlogPostLocales, type BlogPost } from "@/src/server/blog/posts";

export function createBlogPostMetadata(post: BlogPost, locale: BlogPostLocale, title = post.title, description = post.excerpt): Metadata {
  const path = getLocalizedPath(`/blog/${post.slug}`, locale);
  const metadata = createPageMetadata({
    title: `Socratic AI: ${title}`,
    description,
    path,
    ogImage: post.coverImagePath,
    keywords: ["Socratic AI blog", "philosophy", "stoicism", title.toLowerCase()],
  });
  return {
    ...metadata,
    alternates: {
      canonical: absoluteUrl(path),
      languages: Object.fromEntries([
        ...getAvailableBlogPostLocales(post.slug).map((available) => [available, absoluteUrl(getLocalizedPath(`/blog/${post.slug}`, available))]),
        ["x-default", absoluteUrl(`/blog/${post.slug}`)],
      ]),
    },
    openGraph: { ...metadata.openGraph, locale: LOCALE_OG_LOCALES[locale] },
  };
}
