import fs from "node:fs";
import path from "node:path";

export type BlogSortOrder = "newest" | "oldest";

export type BlogPostSummary = {
  slug: string;
  title: string;
  category: string;
  author: string;
  readTimeLabel: string;
  excerpt: string;
  coverImagePath: string;
};

export type BlogPost = BlogPostSummary & {
  markdown: string;
};

export type BlogPostSitemapEntry = {
  slug: string;
  lastModified: Date;
};

type BlogPostRecord = BlogPostSummary & {
  contentFilePath: string;
};

const BLOG_POSTS: BlogPostRecord[] = [
  {
    slug: "philosophy-of-death",
    title: "Philosophy of Death: What the Greatest Thinkers Say About Dying",
    category: "Philosophy",
    author: "Socratic AI team",
    readTimeLabel: "11 min read",
    excerpt:
      "Every great philosopher had something to say about death. None of them said what you expect.",
    coverImagePath: "/blog/images/philosophy-of-death.webp",
    contentFilePath: "public/blog/content/philosophy-of-death.md",
  },
  {
    slug: "meaning-of-life",
    title: "What is the Meaning of Life? Philosophy's Most Honest Answers",
    category: "Philosophy",
    author: "Socratic AI team",
    readTimeLabel: "13 min read",
    excerpt:
      "Philosophy's greatest minds spent their lives on this one question. They didn't agree.",
    coverImagePath: "/blog/images/meaning-of-life.webp",
    contentFilePath: "public/blog/content/meaning-of-life.md",
  },
  {
    slug: "is-ai-making-us-dumber",
    title:
      "Is AI Making Us Dumber? The Question Nobody Wants to Answer Honestly",
    category: "AI & Learning",
    author: "Socratic AI team",
    readTimeLabel: "12 min read",
    excerpt:
      "Most people using AI right now are quietly getting dumber. Here is the honest truth.",
    coverImagePath: "/blog/images/is-ai-making-us-dumber.webp",
    contentFilePath: "public/blog/content/is_ai_making_us_dumber.md",
  },
  {
    slug: "marcus-aurelius-and-stoicism",
    title: "Marcus Aurelius: The Emperor Who Chose Philosophy Over Power",
    category: "Philosophy",
    author: "Socratic AI team",
    readTimeLabel: "12 min read",
    excerpt:
      "The story of Marcus Aurelius - his Stoic philosophy, Meditations, and why he still matters.",
    coverImagePath: "/blog/images/aurelius_stoicism.webp",
    contentFilePath: "public/blog/content/marcus_aurelius_stoicism.md",
  },
  {
    slug: "what-is-philosophy",
    title:
      "What Is Philosophy? And Why It's the Most Practical Thing You Can Study",
    category: "Philosophy",
    author: "Socratic AI team",
    readTimeLabel: "8 min read",
    excerpt:
      "A practical explanation of philosophy, why it matters, and how it sharpens everyday thinking.",
    coverImagePath: "/blog/images/what_is_philosophy.webp",
    contentFilePath: "public/blog/content/what_is_philosophy.md",
  },
  {
    slug: "free-will-vs-determinism",
    title: "Free Will vs Determinism: Do You Actually Have a Choice?",
    category: "Philosophy",
    author: "Socratic AI team",
    readTimeLabel: "10 min read",
    excerpt:
      "A clear tour through the free will debate, from hard determinism to compatibility.",
    coverImagePath: "/blog/images/Free will vs Determinism.webp",
    contentFilePath: "public/blog/content/Free_will_vs_determinism.md",
  },
  {
    slug: "ai-and-critical-thinking",
    title:
      "Thinking is Your Moat: Why AI Will Never Replace the Need to Think for Yourself",
    category: "AI & Learning",
    author: "Socratic AI Founder",
    readTimeLabel: "7 min read",
    excerpt:
      "Why independent thinking becomes more valuable, not less, in an AI-first world.",
    coverImagePath: "/blog/images/thinking_is_your_moat.webp",
    contentFilePath: "public/blog/content/ai_will_never_replace_thinking.md",
  },
  {
    slug: "nietzsche-philosophy",
    title:
      "Nietzsche Was Right: The Philosophy Most People Get Completely Wrong",
    category: "Philosophy",
    author: "Socratic AI team",
    readTimeLabel: "11 min read",
    excerpt:
      "Who Nietzsche really was, what he actually argued, and why his philosophy is still widely misunderstood.",
    coverImagePath: "/blog/images/nietzche.webp",
    contentFilePath: "public/blog/content/nietzsche_blog.md",
  },
  {
    slug: "socratic-method",
    title:
      "The Socratic Method: What It Is and Why It's the Most Powerful Thinking Tool Ever Invented",
    category: "Philosophy",
    author: "Socratic AI team",
    readTimeLabel: "7 min read",
    excerpt:
      "A practical breakdown of the Socratic Method and why it remains the sharpest tool for clear thinking.",
    coverImagePath: "/blog/images/socratic-method.webp",
    contentFilePath: "public/blog/content/socratic_method_blog.md",
  },
  {
    slug: "what-is-socratic-ai",
    title:
      "What is Socratic AI? The Philosophy AI That Actually Challenges You",
    category: "About",
    author: "Socratic AI Founder",
    readTimeLabel: "5 min read",
    excerpt:
      "Why Socratic AI was built, how it works, and what makes it different from general chatbots.",
    coverImagePath: "/blog/images/what-is-SocraticAI.webp",
    contentFilePath: "public/blog/content/what_is_socratic_ai_blog.md",
  },
  {
    slug: "what-is-stoicism",
    title: "What is Stoicism? Understanding Stoicism From the Ground Up",
    category: "Philosophy",
    author: "Socratic AI team",
    readTimeLabel: "15 min read",
    excerpt:
      "The complete story of Stoicism - its origins, core ideas, and how to live it.",
    coverImagePath: "/blog/images/what-is-stoicism.webp",
    contentFilePath: "public/blog/content/stoicism_blog_final.md",
  },
];

function readMarkdownFile(relativePath: string) {
  const absolutePath = path.join(process.cwd(), relativePath);
  return fs.readFileSync(absolutePath, "utf8");
}

function getFileLastModified(relativePath: string) {
  const absolutePath = path.join(process.cwd(), relativePath);
  return fs.statSync(absolutePath).mtime;
}

export function getAllBlogPostSummaries(
  sortOrder: BlogSortOrder,
): BlogPostSummary[] {
  const summaries = BLOG_POSTS.map((post) => ({
    slug: post.slug,
    title: post.title,
    category: post.category,
    author: post.author,
    readTimeLabel: post.readTimeLabel,
    excerpt: post.excerpt,
    coverImagePath: post.coverImagePath,
  }));

  const sorted = [...summaries];
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
    author: post.author,
    readTimeLabel: post.readTimeLabel,
    excerpt: post.excerpt,
    coverImagePath: post.coverImagePath,
    markdown: readMarkdownFile(post.contentFilePath),
  };
}

export function getAllBlogSlugs() {
  return BLOG_POSTS.map((post) => post.slug);
}

export function getBlogPostSitemapEntries(): BlogPostSitemapEntry[] {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
    lastModified: getFileLastModified(post.contentFilePath),
  }));
}
