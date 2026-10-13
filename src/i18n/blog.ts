import enBlog from "@/src/i18n/messages/en/blog.json";
import itBlog from "@/src/i18n/messages/it/blog.json";
import frBlog from "@/src/i18n/messages/fr/blog.json";
import deBlog from "@/src/i18n/messages/de/blog.json";
import ptBrBlog from "@/src/i18n/messages/pt-BR/blog.json";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@/src/i18n/locales";

export type BlogCopy = typeof enBlog;

const BLOG_COPY_BY_LOCALE = {
  en: enBlog,
  it: itBlog,
  fr: frBlog,
  de: deBlog,
  "pt-BR": ptBrBlog,
} satisfies Record<SupportedLocale, BlogCopy>;

export function getBlogCopy(locale: SupportedLocale): BlogCopy {
  return BLOG_COPY_BY_LOCALE[locale] ?? BLOG_COPY_BY_LOCALE[DEFAULT_LOCALE];
}
