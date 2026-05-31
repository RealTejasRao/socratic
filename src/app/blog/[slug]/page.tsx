import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Instrument_Serif, Inter } from "next/font/google";
import { ArrowLeft, Instagram, Linkedin, Mail } from "lucide-react";
import { Footer } from "@/src/components/home/footer";
import { AuthAwareCtaLink } from "@/src/components/navigation/auth-aware-cta-link";
import { MarketingNavbar } from "@/src/components/navigation/marketing-navbar";
import { ROUTES } from "@/src/lib/routes";
import { createPageMetadata } from "@/src/lib/seo";
import {
  getAllBlogSlugs,
  getBlogPostBySlug,
  type BlogPost,
} from "@/src/server/blog/posts";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const interClassName = inter.className;
const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
});

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type MarkdownBlock =
  | { type: "hr" }
  | { type: "h1" | "h2" | "h3" | "p"; content: string }
  | { type: "ul"; items: string[] };

export function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return createPageMetadata({
      title: "Socratic AI: Blog Post Not Found",
      description: "This blog post could not be found.",
      path: `/blog/${slug}`,
    });
  }

  return createPageMetadata({
    title: `Socratic AI: ${post.title}`,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    keywords: [
      "Socratic AI blog",
      "philosophy",
      "stoicism",
      post.title.toLowerCase(),
    ],
  });
}

function toMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let paragraphBuffer: string[] = [];
  let isKeyTakeawaysSection = false;

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) {
      return;
    }

    blocks.push({
      type: "p",
      content: paragraphBuffer.join(" "),
    });
    paragraphBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    if (line === "---") {
      flushParagraph();
      blocks.push({ type: "hr" });
      isKeyTakeawaysSection = false;
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      const content = line.slice(2).trim();
      blocks.push({ type: "h1", content });
      isKeyTakeawaysSection = normalizeHeadingText(content).includes("key takeaways");
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      const content = line.slice(3).trim();
      blocks.push({ type: "h2", content });
      isKeyTakeawaysSection = normalizeHeadingText(content).includes("key takeaways");
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      const content = line.slice(4).trim();
      blocks.push({ type: "h3", content });
      isKeyTakeawaysSection = normalizeHeadingText(content).includes("key takeaways");
      continue;
    }

    if (isKeyTakeawaysSection && line.startsWith("- ")) {
      flushParagraph();
      const item = line.slice(2).trim();
      const previousBlock = blocks.at(-1);

      if (previousBlock?.type === "ul") {
        previousBlock.items.push(item);
      } else {
        blocks.push({ type: "ul", items: [item] });
      }

      continue;
    }

    paragraphBuffer.push(line);
  }

  flushParagraph();
  return blocks;
}

function renderInlineMarkdown(text: string) {
  const tokens: ReactNode[] = [];
  const pattern =
    /(\*\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*)/;
  let remaining = text;
  let tokenIndex = 0;

  while (remaining.length > 0) {
    const match = remaining.match(pattern);

    if (!match || match.index === undefined) {
      tokens.push(remaining);
      break;
    }

    if (match.index > 0) {
      tokens.push(remaining.slice(0, match.index));
    }

    if (match[2] && match[3]) {
      tokens.push(
        <a
          key={`link-${tokenIndex}`}
          href={match[3]}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 underline decoration-blue-600 underline-offset-3 transition-colors duration-200 hover:text-blue-700 hover:decoration-blue-700"
        >
          {match[2]}
        </a>,
      );
    } else if (match[4] && match[5]) {
      tokens.push(
        <a
          key={`link-${tokenIndex}`}
          href={match[5]}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 underline decoration-blue-600 underline-offset-3 transition-colors duration-200 hover:text-blue-700 hover:decoration-blue-700"
        >
          {match[4]}
        </a>,
      );
    } else if (match[6]) {
      tokens.push(
        <strong key={`strong-${tokenIndex}`} className="font-medium text-black/92">
          {match[6]}
        </strong>,
      );
    } else if (match[7]) {
      tokens.push(
        <em key={`em-${tokenIndex}`} className="italic text-black/84">
          {match[7]}
        </em>,
      );
    } else {
      tokens.push(match[0]);
    }

    remaining = remaining.slice(match.index + match[0].length);
    tokenIndex += 1;
  }

  return tokens;
}

const TITLE_HIGHLIGHTS_BY_SLUG: Record<string, string[]> = {
  "what-is-philosophy": ["Philosophy", "Most Practical Thing"],
  "free-will-vs-determinism": ["Free Will", "Determinism"],
  "ai-and-critical-thinking": ["Thinking is Your Moat", "Never"],
  "nietzsche-philosophy": ["Nietzsche Was Right", "Completely Wrong"],
  "socratic-method": ["The Socratic Method", "Most Powerful"],
  "what-is-socratic-ai": ["What is Socratic AI?"],
  "what-is-stoicism": ["What is Stoicism?"],
  "marcus-aurelius-and-stoicism": ["Marcus Aurelius", "Philosophy Over Power"],
  "is-ai-making-us-dumber": ["Dumber", "Honestly", "AI"],
  "meaning-of-life": ["Meaning of Life", "Honest"],
  "philosophy-of-death": ["Philosophy of Death", "Dying"],
  "think-like-a-philosopher": ["5 Mental Models", "Think"],
  "soren-kierkegaard-and-existentialism": ["Søren Kierkegaard"],
  "does-god-exists": ["Does God Exist?", "Biggest Question"],
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderStyledPostTitle(post: BlogPost) {
  const phrases = TITLE_HIGHLIGHTS_BY_SLUG[post.slug];
  if (!phrases || phrases.length === 0) {
    return post.title;
  }

  const highlightSet = new Set(phrases.map((phrase) => phrase.toLowerCase()));
  const pattern = new RegExp(`(${phrases.map(escapeRegExp).join("|")})`, "gi");
  const parts = post.title.split(pattern);

  return parts.map((part, index) => {
    if (highlightSet.has(part.toLowerCase())) {
      return (
        <span key={`highlight-${index}`} className="text-[#a01717]">
          {part}
        </span>
      );
    }

    return <span key={`title-${index}`}>{part}</span>;
  });
}

function renderMarkdownBlock(block: MarkdownBlock, index: number) {
  if (block.type === "hr") {
    return <hr key={`hr-${index}`} className="my-10 border-black/10" />;
  }

  if (block.type === "h1") {
    return (
      <h1
        key={`h1-${index}`}
        className={`${instrumentSerif.className} mt-3 text-[2.2rem] leading-[1.16] tracking-normal text-black sm:text-[2.7rem]`}
      >
        {renderInlineMarkdown(block.content)}
      </h1>
    );
  }

  if (block.type === "h2") {
    return (
      <h2
        key={`h2-${index}`}
        className={`${instrumentSerif.className} mt-12 text-[1.9rem] leading-[1.18] tracking-normal text-black/92 sm:text-[2.25rem]`}
      >
        {renderInlineMarkdown(block.content)}
      </h2>
    );
  }

  if (block.type === "h3") {
    return (
      <h3
        key={`h3-${index}`}
        className={`${instrumentSerif.className} mt-10 text-[1.55rem] leading-[1.2] tracking-normal text-black/90 sm:text-[1.8rem]`}
      >
        {renderInlineMarkdown(block.content)}
      </h3>
    );
  }

  if (block.type === "ul") {
    return (
      <ul
        key={`ul-${index}`}
        className={`${interClassName} mt-6 list-disc space-y-4 pl-6 text-[1.03rem] leading-[1.75] tracking-normal text-black/82 marker:text-black/72 sm:text-[1.1rem]`}
      >
        {block.items.map((item, itemIndex) => (
          <li key={`li-${index}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>
    );
  }

  return (
    <p
      key={`p-${index}`}
      className={`${interClassName} mt-6 text-[1.03rem] leading-[1.95] tracking-normal text-black/82 sm:text-[1.1rem]`}
    >
      {renderInlineMarkdown(block.content)}
    </p>
  );
}

function normalizeHeadingText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function PostContent({ post }: { post: BlogPost }) {
  const rawBlocks = toMarkdownBlocks(post.markdown).filter((block) => {
    if (block.type !== "p") {
      return true;
    }

    if (
      block.content.includes(
        "Socratic AI is built on the greatest philosophical texts ever written",
      )
    ) {
      return false;
    }

    if (
      (block.content.includes("Try Socratic AI") ||
        block.content.includes("Try Socratic AI Now")) &&
      block.content.includes("usesocratic.com")
    ) {
      return false;
    }

    return true;
  });

  const normalizedPostTitle = normalizeHeadingText(post.title);
  const firstHeadingIndex = rawBlocks.findIndex((block) => block.type === "h1");
  const blocks = rawBlocks.filter((block, index) => {
    if (index !== firstHeadingIndex || block.type !== "h1") {
      return true;
    }

    return normalizeHeadingText(block.content) !== normalizedPostTitle;
  });

  while (blocks[0]?.type === "hr") {
    blocks.shift();
  }

  return (
    <article>
      {blocks.map((block, index) => renderMarkdownBlock(block, index))}

      <div className="mt-14 rounded-[3px] border border-black/10 bg-[#f0f0f0] px-6 py-7 sm:px-9 sm:py-9">
        <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
          <div>
            <h3
              className={`${interClassName} text-[2rem] font-semibold text-black/92`}
            >
              Socratic AI
            </h3>
            <p
              className={`${interClassName} mt-3 max-w-180 text-[1.02rem] leading-[1.85] text-black/76 sm:text-[1.06rem]`}
            >
              Socratic AI is built on the greatest philosophical texts ever
              written. The thinking partner you never had, available even at 2 AM
              when the questions won&apos;t stop. Ask anything. Debate everything.
            </p>
          </div>

          <AuthAwareCtaLink
            signedOutHref={ROUTES.SIGN_UP}
            showPendingStateOnNavigate
            pendingIndicator="roseCurve"
            className={`${interClassName} inline-flex w-full min-w-62 items-center justify-center rounded-[3px] border border-[#a01717] bg-[#a01717] px-6 py-4 text-[1rem] font-semibold text-white transition-colors duration-220 hover:bg-[#8f1414] lg:w-auto`}
          >
            Try Socratic AI Now
          </AuthAwareCtaLink>
        </div>
      </div>
    </article>
  );
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const shareItems = [
    {
      label: "X",
      href: "https://x.com/useSocraticAI",
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.847h-7.406l-5.8-7.584-6.639 7.584H.474l8.599-9.83L0 1.154h7.594l5.243 6.932zM17.61 20.644h2.039L6.486 3.24H4.298z" />
        </svg>
      ),
    },
    {
      label: "Email",
      href: "mailto:usesocratic@gmail.com",
      icon: <Mail size={14} />,
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/company/usesocratic/",
      icon: <Linkedin size={14} />,
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/usesocratic/",
      icon: <Instagram size={14} />,
    },
  ];

  return (
    <main className="min-h-screen bg-white text-black">
      <MarketingNavbar
        interClassName={interClassName}
        instrumentSerifClassName={instrumentSerif.className}
        sectionPrefix={ROUTES.HOME}
      />

      <section className="px-5 pt-30 pb-20 sm:px-7 sm:pt-34">
        <div className="mx-auto w-full max-w-365">
          <Link
            href={ROUTES.BLOG}
            className={`${interClassName} inline-flex items-center gap-2 rounded-full border border-black/16 bg-[#2f2f2f] px-4 py-2 text-[0.82rem] font-semibold tracking-[0.01em] text-white transition-all duration-220 hover:-translate-y-0.5 hover:border-[#a01717]/45 hover:bg-[#a01717]`}
          >
            <ArrowLeft size={14} />
            Back to Blogs
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[56px_minmax(0,1fr)] lg:gap-16">
            <aside className="lg:sticky lg:top-32 lg:h-fit">
              <ul className="flex items-center gap-2.5 lg:flex-col lg:items-start">
                {shareItems.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                      aria-label={item.label}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/12 text-black/74 transition-colors duration-200 hover:border-[#a01717]/45 hover:text-[#a01717]"
                    >
                      {item.icon}
                    </a>
                  </li>
                ))}
              </ul>
            </aside>

            <article className="w-full max-w-220">
              <p
                className={`${interClassName} text-[0.76rem] font-semibold tracking-[0.14em] text-[#a01717] uppercase`}
              >
                {post.category}
              </p>
              <h1
                className={`${instrumentSerif.className} mt-4 text-[clamp(2.6rem,6vw,5.5rem)] leading-[1.02] tracking-normal text-black`}
              >
                {renderStyledPostTitle(post)}
              </h1>
              <p
                className={`${interClassName} mt-5 max-w-190 text-[clamp(1rem,1.95vw,1.28rem)] leading-[1.68] tracking-normal text-black/74`}
              >
                {post.excerpt}
              </p>
              <p className={`${interClassName} mt-6 text-[0.84rem] text-black/56`}>
                {post.author} • {post.readTimeLabel}
              </p>

              <div className="mt-12 border-t border-black/10 pt-6">
                <PostContent post={post} />
              </div>
            </article>
          </div>
        </div>
      </section>

      <Footer interClassName={interClassName} sectionPrefix={ROUTES.HOME} />
    </main>
  );
}
