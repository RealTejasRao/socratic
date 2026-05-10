import fs from "node:fs";
import path from "node:path";

export type BlogSortOrder = "newest" | "oldest";

export type BlogPostSummary = {
  slug: string;
  title: string;
  category: string;
  readTimeLabel: string;
  publishedAt: string;
  excerpt: string;
  coverImagePath: string;
};

export type BlogPost = BlogPostSummary & {
  markdown: string;
};

type BlogPostRecord = BlogPostSummary & {
  contentFilePath: string;
};

const BLOG_POSTS: BlogPostRecord[] = [
  {
    slug: "what-is-stoicism-understanding-stoicism-from-the-ground-up",
    title: "What is Stoicism? Understanding Stoicism From the Ground Up",
    category: "Philosophy",
    readTimeLabel: "15 min read",
    publishedAt: "2026-05-11",
    excerpt:
      "A grounded introduction to Stoicism through Socrates, Zeno, Epictetus, Seneca, and Marcus Aurelius.",
    coverImagePath: "/blog/Philosophy/Aurelius.webp",
    contentFilePath: "public/instruction/stoicism_blog_final.md",
  },
];

function readMarkdownFile(relativePath: string) {
  const absolutePath = path.join(process.cwd(), relativePath);
  return fs.readFileSync(absolutePath, "utf8");
}

function compareByDate(a: BlogPostSummary, b: BlogPostSummary) {
  return (
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getAllBlogPostSummaries(
  sortOrder: BlogSortOrder,
): BlogPostSummary[] {
  const summaries = BLOG_POSTS.map((post) => ({
    slug: post.slug,
    title: post.title,
    category: post.category,
    readTimeLabel: post.readTimeLabel,
    publishedAt: post.publishedAt,
    excerpt: post.excerpt,
    coverImagePath: post.coverImagePath,
  }));

  const sorted = summaries.sort(compareByDate);
  if (sortOrder === "oldest") {
    sorted.reverse();
  }

  return sorted;
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  const post = BLOG_POSTS.find((entry) => entry.slug === slug);
  if (!post) {
    return null;
  }

  return {
    slug: post.slug,
    title: post.title,
    category: post.category,
    readTimeLabel: post.readTimeLabel,
    publishedAt: post.publishedAt,
    excerpt: post.excerpt,
    coverImagePath: post.coverImagePath,
    markdown: readMarkdownFile(post.contentFilePath),
  };
}

export function getAllBlogSlugs() {
  return BLOG_POSTS.map((post) => post.slug);
}
