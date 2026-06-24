import fs from "node:fs";
import path from "node:path";

export type BlogSortOrder = "newest" | "oldest";

export type BlogPostSummary = {
  slug: string;
  title: string;
  category: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
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
    slug: "philosophy-of-power",
    title:
      "The Philosophy of Power: What Machiavelli, Nietzsche, and Aristotle Actually Said",
    category: "Philosophy",
    author: "Socratic AI team",
    publishedAt: "2026-06-09T03:26:59+05:30",
    updatedAt: "2026-06-09T03:26:59+05:30",
    readTimeLabel: "16 min read",
    excerpt:
      "Machiavelli studied it. Nietzsche diagnosed it. Aristotle asked what it was for. Here is what they found.",
    coverImagePath: "/blog/images/philosophy-of-power.webp",
    contentFilePath: "public/blog/content/philosophy_of_power.md",
  },
  {
    slug: "plato-vs-aristotle",
    title: "Plato vs Aristotle: The Debate That Split Philosophy in Two",
    category: "Philosophy",
    author: "Socratic AI team",
    publishedAt: "2026-06-06T18:05:13+05:30",
    updatedAt: "2026-06-06T18:05:13+05:30",
    readTimeLabel: "17 min read",
    excerpt:
      "One pointed up. One pointed out. Their disagreement split Western thought in two and never stopped.",
    coverImagePath: "/blog/images/plato-vs-aristotle.webp",
    contentFilePath: "public/blog/content/plato_vs_aristotle.md",
  },
  {
    slug: "what-is-epistemology",
    title: "What is Epistemology? How Do We Actually Know What We Know?",
    category: "Philosophy",
    author: "Socratic AI team",
    publishedAt: "2026-06-06T18:05:13+05:30",
    updatedAt: "2026-06-06T18:05:13+05:30",
    readTimeLabel: "14 min read",
    excerpt:
      "You believe thousands of things. How many of them do you actually know?",
    coverImagePath: "/blog/images/what-is-epistemology.webp",
    contentFilePath: "public/blog/content/what_is_epistemology.md",
  },
  {
    slug: "socratic-ai-story",
    title: "Socratic AI: The Background Story",
    category: "About",
    author: "Socratic AI Founder",
    publishedAt: "2026-06-09T03:26:59+05:30",
    updatedAt: "2026-06-09T03:26:59+05:30",
    readTimeLabel: "9 min read",
    excerpt:
      "This blog contains my personal views and why I built Socratic AI.",
    coverImagePath: "/blog/images/socratic-ai-story.webp",
    contentFilePath: "public/blog/content/socratic_ai_story.md",
  },
  {
    slug: "critical-thinking-in-ai-era",
    title: "Why Critical Thinking is the Most Valuable Skill in the AI Era",
    category: "Philosophy",
    author: "Socratic AI team",
    publishedAt: "2026-06-02T12:02:09+05:30",
    updatedAt: "2026-06-02T12:02:09+05:30",
    readTimeLabel: "12 min read",
    excerpt:
      "AI automates outputs. Critical thinking determines whether those outputs are any good.",
    coverImagePath: "/blog/images/critical-thinking-ai-era.webp",
    contentFilePath: "public/blog/content/critical-thinking-ai-era.md",
  },
  {
    slug: "what-is-consciousness",
    title: "What is Consciousness? The Hardest Problem in All of Philosophy",
    category: "Philosophy",
    author: "Socratic AI team",
    publishedAt: "2026-05-31T16:12:34+05:30",
    updatedAt: "2026-05-31T16:12:34+05:30",
    readTimeLabel: "16 min read",
    excerpt:
      "You cannot doubt that you are conscious. We have no idea what consciousness actually is.",
    coverImagePath: "/blog/images/what-is-consciousness.webp",
    contentFilePath: "public/blog/content/what_is_consciousness.md",
  },
  {
    slug: "debate-ai",
    title:
      "Debate AI: How to Use Artificial Intelligence to Become a Sharper, Deadlier Debater",
    category: "Philosophy",
    author: "Socratic AI team",
    publishedAt: "2026-05-31T16:12:34+05:30",
    updatedAt: "2026-05-31T16:12:34+05:30",
    readTimeLabel: "11 min read",
    excerpt:
      "The best debaters practice against opponents who are trying to destroy their argument. AI does that.",
    coverImagePath: "/blog/images/debate-ai.webp",
    contentFilePath: "public/blog/content/debate_ai.md",
  },
  {
    slug: "does-god-exist",
    title:
      "Does God Exist? Philosophy's Most Honest Answer to the Biggest Question Ever Asked",
    category: "Philosophy",
    author: "Socratic AI team",
    publishedAt: "2026-05-31T11:32:00+05:30",
    updatedAt: "2026-05-31T11:32:00+05:30",
    readTimeLabel: "21 min read",
    excerpt:
      "The greatest minds in history disagreed completely. Here is every argument, honestly examined.",
    coverImagePath: "/blog/images/does-god-exists.webp",
    contentFilePath: "public/blog/content/does_god_exists.md",
  },
  {
    slug: "soren-kierkegaard-and-existentialism",
    title: "Søren Kierkegaard: The Father of Existentialism",
    category: "Philosophy",
    author: "Socratic AI team",
    publishedAt: "2026-05-30T01:39:19+05:30",
    updatedAt: "2026-05-30T01:39:19+05:30",
    readTimeLabel: "14 min read",
    excerpt:
      "The life and philosophy of Søren Kierkegaard, the man also called the father of existentialism.",
    coverImagePath: "/blog/images/soren.webp",
    contentFilePath:
      "public/blog/content/søren_kierkegaard_and_existentialism.md",
  },
  {
    slug: "think-like-a-philosopher",
    title:
      "How to Think Like a Philosopher: 5 Mental Models That Change Everything",
    category: "Philosophy",
    author: "Socratic AI team",
    publishedAt: "2026-05-31T11:32:00+05:30",
    updatedAt: "2026-05-31T11:32:00+05:30",
    readTimeLabel: "13 min read",
    excerpt:
      "Five actually useful mental models philosophers use to think clearly about anything.",
    coverImagePath: "/blog/images/think-like-a-philosopher.webp",
    contentFilePath: "public/blog/content/think_like_a_philosopher.md",
  },
  {
    slug: "philosophy-of-death",
    title: "Philosophy of Death: What the Greatest Thinkers Say About Dying",
    category: "Philosophy",
    author: "Socratic AI team",
    publishedAt: "2026-05-30T16:07:25+05:30",
    updatedAt: "2026-05-30T16:07:25+05:30",
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
    publishedAt: "2026-05-30T16:07:25+05:30",
    updatedAt: "2026-05-30T16:07:25+05:30",
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
    publishedAt: "2026-05-30T16:07:25+05:30",
    updatedAt: "2026-05-30T16:07:25+05:30",
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
    publishedAt: "2026-05-30T16:07:25+05:30",
    updatedAt: "2026-05-30T16:07:25+05:30",
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
    publishedAt: "2026-05-11T18:16:10+05:30",
    updatedAt: "2026-05-30T01:39:19+05:30",
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
    publishedAt: "2026-05-11T18:16:10+05:30",
    updatedAt: "2026-05-30T01:39:19+05:30",
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
    publishedAt: "2026-05-11T18:16:10+05:30",
    updatedAt: "2026-05-30T01:39:19+05:30",
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
    publishedAt: "2026-05-11T18:16:10+05:30",
    updatedAt: "2026-05-30T01:39:19+05:30",
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
    publishedAt: "2026-05-11T18:16:10+05:30",
    updatedAt: "2026-05-30T01:39:19+05:30",
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
    publishedAt: "2026-05-11T18:16:10+05:30",
    updatedAt: "2026-05-30T01:39:19+05:30",
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
    publishedAt: "2026-05-11T04:54:50+05:30",
    updatedAt: "2026-05-30T01:39:19+05:30",
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
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
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
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
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
