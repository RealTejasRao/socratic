import type { Metadata } from "next";
import { createBlogMetadata } from "@/src/i18n/blog-metadata";
import { LocalizedBlogPage, type BlogPageSearchParams } from "./localized-blog-page";

export const metadata: Metadata = createBlogMetadata("en");

type BlogPageProps = {
  searchParams?: BlogPageSearchParams;
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  return <LocalizedBlogPage locale="en" searchParams={searchParams} />;
}
