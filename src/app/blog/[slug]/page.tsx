import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cormorant_Garamond, Instrument_Serif, Inter } from "next/font/google";
import { ArrowLeft } from "lucide-react";
import { StaggeredMenu } from "@/src/components/home/staggered-menu";
import { resolveCloudinaryPublicAsset } from "@/src/lib/cloudinary-public-assets";
import { ROUTES } from "@/src/lib/routes";
import { createPageMetadata } from "@/src/lib/seo";
import {
  getAllBlogSlugs,
  getBlogPostBySlug,
  type BlogPost,
} from "@/src/server/blog/posts";

const poppinsClassName = "[font-family:Poppins,sans-serif]";
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const interClassName = inter.className;
const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
});
const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const navLinks = [
  { label: "Home", href: ROUTES.HOMEPAGE },
  { label: "Features", href: `${ROUTES.HOMEPAGE}#features` },
  { label: "Use Cases", href: `${ROUTES.HOMEPAGE}#use-cases` },
  { label: "Blog", href: ROUTES.BLOG },
  { label: "Contact", href: `${ROUTES.HOMEPAGE}#contact` },
];

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type MarkdownBlock =
  | { type: "hr" }
  | { type: "h1" | "h2" | "h3" | "p"; content: string };

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
      title: "Blog Post Not Found | Socratic AI",
      description: "This blog post could not be found.",
      path: `/blog/${slug}`,
    });
  }

  return createPageMetadata({
    title: `${post.title} | Socratic AI Blog`,
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
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      blocks.push({ type: "h1", content: line.slice(2).trim() });
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      blocks.push({ type: "h2", content: line.slice(3).trim() });
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      blocks.push({ type: "h3", content: line.slice(4).trim() });
      continue;
    }

    paragraphBuffer.push(line);
  }

  flushParagraph();
  return blocks;
}

function renderInlineMarkdown(text: string) {
  const tokens: React.ReactNode[] = [];
  const pattern =
    /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*)/;
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
          className="underline decoration-black/30 underline-offset-3 transition-colors duration-200 hover:text-[#a01717] hover:decoration-[#a01717]"
        >
          {match[2]}
        </a>,
      );
    } else if (match[4]) {
      tokens.push(
        <strong key={`strong-${tokenIndex}`} className="font-semibold text-black/88">
          {match[4]}
        </strong>,
      );
    } else if (match[5]) {
      tokens.push(
        <em key={`em-${tokenIndex}`} className="italic text-black/82">
          {match[5]}
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

function renderMarkdownBlock(block: MarkdownBlock, index: number) {
  if (block.type === "hr") {
    return <hr key={`hr-${index}`} className="my-8 border-black/8" />;
  }

  if (block.type === "h1") {
    return (
      <h1
        key={`h1-${index}`}
        className={`${cormorantGaramond.className} mt-3 text-[2.2rem] leading-[1.06] tracking-[-0.02em] text-black/92 sm:text-[2.6rem]`}
      >
        {renderInlineMarkdown(block.content)}
      </h1>
    );
  }

  if (block.type === "h2") {
    return (
      <h2
        key={`h2-${index}`}
        className={`${cormorantGaramond.className} mt-10 text-[1.95rem] leading-[1.1] tracking-[-0.02em] text-black/90 sm:text-[2.15rem]`}
      >
        {renderInlineMarkdown(block.content)}
      </h2>
    );
  }

  if (block.type === "h3") {
    return (
      <h3
        key={`h3-${index}`}
        className={`${cormorantGaramond.className} mt-8 text-[1.48rem] leading-[1.14] tracking-[-0.01em] text-black/88 sm:text-[1.62rem]`}
      >
        {renderInlineMarkdown(block.content)}
      </h3>
    );
  }

  return (
    <p
      key={`p-${index}`}
      className={`${interClassName} mt-5 text-[1rem] leading-8 font-normal text-black/72 sm:text-[1.05rem]`}
    >
      {renderInlineMarkdown(block.content)}
    </p>
  );
}

function PostContent({ post }: { post: BlogPost }) {
  const blocks = toMarkdownBlocks(post.markdown).filter((block) => {
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
      block.content.includes("Try Socratic AI") &&
      block.content.includes("usesocratic.com")
    ) {
      return false;
    }

    return true;
  });

  return (
    <article className="mx-auto w-full max-w-220 px-4 pb-22 sm:px-8">
      {blocks.map((block, index) => renderMarkdownBlock(block, index))}

      <div className="mt-16 overflow-hidden rounded-[18px] border border-[#a01717]/18 bg-[linear-gradient(135deg,#fff9f7_0%,#fff2eb_45%,#fffaf6_100%)] p-6 shadow-[0_20px_42px_rgba(160,23,23,0.10)] sm:p-8">
        <p
          className={`${instrumentSerif.className} text-[1.45rem] leading-[1.25] text-black/86 sm:text-[1.7rem]`}
        >
          Keep this momentum going with Socratic AI.
        </p>
        <p
          className={`${interClassName} mt-2 max-w-150 text-[0.99rem] leading-7 text-black/68 sm:text-[1.02rem]`}
        >
          Explore the original Stoic texts, challenge your assumptions, and
          sharpen your thinking through dialogue.
        </p>

        <a
          href="https://usesocrtic.com"
          target="_blank"
          rel="noreferrer"
          className={`${interClassName} mt-5 inline-flex items-center justify-center rounded-full border border-[#a01717]/35 bg-[#a01717] px-5 py-2.5 text-[0.9rem] font-medium tracking-[0.01em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#8f1414]`}
        >
          Try Socratic AI
        </a>
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

  return (
    <main className={`min-h-screen bg-[#fefefc] ${poppinsClassName}`}>
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(160,23,23,0.1)_1px,transparent_1.5px)] bg-size-[22px_22px]" />
      </div>

      <header className="fixed inset-x-0 top-0 z-50 flex flex-col border-b border-black/6 bg-white/60 px-5 py-0 backdrop-blur-md supports-backdrop-filter:bg-white/50 sm:px-7 sm:pt-1.5 sm:pb-0">
        <nav className="relative mx-auto flex h-16 w-full max-w-365 items-center justify-between sm:h-auto">
          <Link
            href={ROUTES.HOMEPAGE}
            className="group relative flex h-11 w-fit items-center sm:h-8.5"
          >
            <div className="shrink-0 overflow-hidden">
              <Image
                src={resolveCloudinaryPublicAsset("/brand/Logo_Dark_SVG.svg")}
                alt="Socratic AI logo"
                width={50}
                height={50}
                className="h-12 w-12 object-contain transition duration-500 ease-out group-hover:-translate-y-0.5 group-hover:scale-[1.02] sm:h-10 sm:w-10"
                priority
              />
            </div>

            <div className="pointer-events-none absolute left-13 top-1/2 flex -translate-y-1/2 items-center overflow-hidden">
              <span className="mr-3 h-4 w-px shrink-0 origin-center scale-y-0 bg-black/22 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100 group-hover:opacity-100" />
              <span
                className={`${instrumentSerif.className} -translate-x-4.5 whitespace-nowrap text-[1.15rem] font-normal tracking-[0.01em] text-black/78 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0 group-hover:opacity-100`}
              >
                Socratic AI
              </span>
            </div>
          </Link>

          <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
            <div className="pointer-events-auto flex items-center justify-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`${interClassName} cursor-pointer text-[0.8rem] font-normal text-black/60 transition-colors duration-200 hover:text-black`}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Link
              href={ROUTES.HOME}
              className={`${interClassName} inline-flex h-9 min-w-24 items-center justify-center rounded-full border border-black/18 bg-black px-5 text-[0.82rem] font-medium tracking-[0.02em] text-white transition-all duration-250 hover:-translate-y-0.5 hover:bg-black/92 sm:h-7.5 sm:min-w-22 sm:px-4.5 sm:text-[0.76rem]`}
            >
              Try Socratic AI
            </Link>

            <StaggeredMenu
              className="lg:hidden"
              triggerVariant="hamburger"
              items={navLinks.map((link) => ({
                label: link.label,
                link: link.href,
                ariaLabel: `Go to ${link.label}`,
              }))}
            />
          </div>
        </nav>

        <div className="mx-auto mt-1.5 w-full max-w-365">
          <div className="h-px w-full bg-[radial-gradient(circle,rgba(120,120,120,0.45)_1px,transparent_1.2px)] bg-position-[left_center] bg-size-[10px_1px] bg-repeat-x" />
        </div>
      </header>

      <section className="relative z-10 flex min-h-screen flex-col px-5 pt-28 pb-8 sm:px-7 sm:pt-30">
        <div className="mx-auto flex w-full max-w-365 flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-170 flex-col items-center text-center">
            <h1
              className={`${instrumentSerif.className} text-[clamp(2.6rem,6vw,4.9rem)] leading-[0.96] tracking-[-0.02em] text-black/92`}
            >
              What is <span className="text-[#a01717]">Stoicism</span>?
            </h1>
            <p
              className={`${instrumentSerif.className} mt-4 text-[clamp(1.3rem,3vw,2rem)] leading-[1.08] tracking-[-0.01em] text-black/68`}
            >
              Understanding Stoicism from the ground up.
            </p>
          </div>

          <div className="flex-1" />
        </div>
      </section>

      <section className="relative z-10 pt-8 sm:pt-12">
        <div className="sticky top-[4.85rem] left-0 z-40 mx-auto mb-4 w-full max-w-220 px-4 sm:top-[5.05rem] sm:px-8">
          <Link
            href={ROUTES.BLOG}
            className={`${interClassName} inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f3f3f2]/96 px-3.5 py-2 text-[0.86rem] font-medium text-black/76 backdrop-blur-sm transition-colors duration-200 hover:border-[#a01717]/30 hover:bg-[#a01717] hover:text-white`}
          >
            <ArrowLeft size={14} />
            Back to Blogs
          </Link>
        </div>

        <PostContent post={post} />
      </section>

      <footer className="relative z-10 border-t border-black/8 bg-white/72 px-5 py-8 sm:px-7 sm:py-10">
        <div className="mx-auto flex w-full max-w-365 flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className={`${interClassName} text-[0.88rem] text-black/56`}>
            © {new Date().getFullYear()} Socratic AI. Think better, live wiser.
          </p>
          <a
            href="https://usesocrtic.com"
            target="_blank"
            rel="noreferrer"
            className={`${interClassName} text-[0.88rem] font-medium text-black/70 transition-colors duration-200 hover:text-[#a01717]`}
          >
            Visit usesocrtic.com
          </a>
        </div>
      </footer>
    </main>
  );
}
