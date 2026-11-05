import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  LocalizedBlogPostPage,
  getMarkdownExcerpt,
  getMarkdownTitle,
} from "@/src/app/blog/[slug]/page";
import {
  DEFAULT_LOCALE,
  BLOG_POST_LOCALES,
  isBlogPostLocale,
  type BlogPostLocale,
} from "@/src/i18n/locales";
import { createBlogPostMetadata } from "@/src/i18n/blog-post-metadata";
import {
  getBlogPostBySlug,
  getTranslatedBlogPostSlugs,
} from "@/src/server/blog/posts";

export const dynamicParams = false;

type LocalizedBlogPostPageRouteProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export function generateStaticParams() {
  return BLOG_POST_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).flatMap(
    (locale) =>
      getTranslatedBlogPostSlugs(locale).map((slug) => ({
        locale,
        slug,
      })),
  );
}

async function resolveParams(
  params: LocalizedBlogPostPageRouteProps["params"],
): Promise<{ locale: BlogPostLocale; slug: string }> {
  const { locale, slug } = await params;

  if (!isBlogPostLocale(locale) || locale === DEFAULT_LOCALE) {
    notFound();
  }

  if (!getBlogPostBySlug(slug, locale)) {
    notFound();
  }

  return { locale, slug };
}

export async function generateMetadata({
  params,
}: LocalizedBlogPostPageRouteProps): Promise<Metadata> {
  const { locale, slug } = await resolveParams(params);
  const post = getBlogPostBySlug(slug, locale);

  if (!post) {
    notFound();
  }

  const displayTitle = getMarkdownTitle(post.markdown) ?? post.title;
  const displayExcerpt = getMarkdownExcerpt(post.markdown, post.excerpt);

  return createBlogPostMetadata(post, locale, displayTitle, displayExcerpt);
}

export default async function LocaleBlogPostPage({
  params,
}: LocalizedBlogPostPageRouteProps) {
  const { locale, slug } = await resolveParams(params);
  return <LocalizedBlogPostPage slug={slug} locale={locale} />;
}
