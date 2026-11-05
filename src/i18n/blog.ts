import enBlog from "@/src/i18n/messages/en/blog.json";
import itBlog from "@/src/i18n/messages/it/blog.json";
import frBlog from "@/src/i18n/messages/fr/blog.json";
import deBlog from "@/src/i18n/messages/de/blog.json";
import ptBrBlog from "@/src/i18n/messages/pt-BR/blog.json";
import ruBlog from "@/src/i18n/messages/ru/blog.json";
import arBlog from "@/src/i18n/messages/ar/blog.json";
import {
  DEFAULT_LOCALE,
  type BlogLocale,
} from "@/src/i18n/locales";

export type BlogCopy = typeof enBlog;

const BLOG_COPY_BY_LOCALE = {
  en: enBlog,
  it: itBlog,
  fr: frBlog,
  de: deBlog,
  "pt-BR": ptBrBlog,
  ru: ruBlog,
  ar: arBlog,
} satisfies Record<BlogLocale, BlogCopy>;

export function getBlogCopy(locale: BlogLocale): BlogCopy {
  return BLOG_COPY_BY_LOCALE[locale] ?? BLOG_COPY_BY_LOCALE[DEFAULT_LOCALE];
}
