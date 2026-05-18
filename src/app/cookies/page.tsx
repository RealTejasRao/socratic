import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Instrument_Serif, Inter } from "next/font/google";
import { Instagram, Linkedin, Mail, Youtube } from "lucide-react";
import { Footer } from "@/src/components/home/footer";
import { AuthAwareCtaLink } from "@/src/components/navigation/auth-aware-cta-link";
import { MarketingNavbar } from "@/src/components/navigation/marketing-navbar";
import { ROUTES } from "@/src/lib/routes";
import { createPageMetadata } from "@/src/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Cookie Policy",
  description:
    "Read Socratic AI's Cookie Policy to understand what cookies we use, why we use them, and how you can manage your preferences.",
  path: "/cookies",
  index: false,
  follow: true,
});

async function getCookiePolicyHtml() {
  const policyPath = path.join(
    process.cwd(),
    "public",
    "legal",
    "cookie-policy.md",
  );
  return fs.readFile(policyPath, "utf8");
}

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const interClassName = inter.className;
const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
});

type MarkdownBlock =
  | { type: "hr" }
  | { type: "h1" | "h2" | "h3" | "p"; content: string }
  | { type: "ul" | "ol"; items: string[] };

function extractLegalDocumentMeta(blocks: MarkdownBlock[]) {
  let index = 0;
  let lastUpdated: string | null = null;

  if (blocks[index]?.type === "h1") {
    index += 1;
  }

  const maybeLastUpdated = blocks[index];
  if (maybeLastUpdated?.type === "p") {
    const plain = maybeLastUpdated.content.replace(/^\*+|\*+$/g, "").trim();
    if (/^last updated/i.test(plain)) {
      lastUpdated = plain.replace(/^last updated:?\s*/i, "").trim();
      index += 1;
    }
  }

  return {
    lastUpdated,
    contentBlocks: blocks.slice(index),
  };
}

function toMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let paragraphBuffer: string[] = [];
  let listBuffer: { type: "ul" | "ol"; items: string[] } | null = null;

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

  const flushList = () => {
    if (!listBuffer || listBuffer.items.length === 0) {
      listBuffer = null;
      return;
    }

    blocks.push({
      type: listBuffer.type,
      items: [...listBuffer.items],
    });
    listBuffer = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line === "---") {
      flushParagraph();
      flushList();
      blocks.push({ type: "hr" });
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h1", content: line.slice(2).trim() });
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h2", content: line.slice(3).trim() });
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h3", content: line.slice(4).trim() });
      continue;
    }

    const unorderedMatch = line.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      const item = unorderedMatch[1];
      if (!item) {
        continue;
      }
      flushParagraph();
      if (!listBuffer || listBuffer.type !== "ul") {
        flushList();
        listBuffer = { type: "ul", items: [] };
      }
      listBuffer.items.push(item.trim());
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      const item = orderedMatch[1];
      if (!item) {
        continue;
      }
      flushParagraph();
      if (!listBuffer || listBuffer.type !== "ol") {
        flushList();
        listBuffer = { type: "ol", items: [] };
      }
      listBuffer.items.push(item.trim());
      continue;
    }

    flushList();
    paragraphBuffer.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

function renderInlineMarkdown(text: string) {
  const tokens: ReactNode[] = [];
  const pattern =
    /(\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}))/;
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
      const href = match[3];
      const isExternal = href.startsWith("http");
      tokens.push(
        <a
          key={`link-${tokenIndex}`}
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noreferrer" : undefined}
          className="text-blue-600 underline decoration-blue-600 underline-offset-3 transition-colors duration-200 hover:text-blue-700 hover:decoration-blue-700"
        >
          {match[2]}
        </a>,
      );
    } else if (match[4]) {
      tokens.push(
        <strong key={`strong-${tokenIndex}`} className="font-semibold text-black/90">
          {match[4]}
        </strong>,
      );
    } else if (match[5]) {
      tokens.push(
        <em key={`em-${tokenIndex}`} className="italic text-black/84">
          {match[5]}
        </em>,
      );
    } else if (match[6]) {
      tokens.push(
        <code
          key={`code-${tokenIndex}`}
          className="rounded bg-black/6 px-1.5 py-0.5 text-[0.9em] text-black/85"
        >
          {match[6]}
        </code>,
      );
    } else if (match[7]) {
      tokens.push(
        <a
          key={`email-${tokenIndex}`}
          href={`mailto:${match[7]}`}
          className="text-blue-600 underline decoration-blue-600 underline-offset-3 transition-colors duration-200 hover:text-blue-700 hover:decoration-blue-700"
        >
          {match[7]}
        </a>,
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
    return <hr key={`hr-${index}`} className="my-10 border-black/10" />;
  }

  if (block.type === "h1") {
    return (
      <h1
        key={`h1-${index}`}
        className={`${instrumentSerif.className} mt-2 text-[2.35rem] leading-[1.08] tracking-normal text-black sm:text-[3rem]`}
      >
        {renderInlineMarkdown(block.content)}
      </h1>
    );
  }

  if (block.type === "h2") {
    return (
      <h2
        key={`h2-${index}`}
        className={`${instrumentSerif.className} mt-12 text-[1.8rem] leading-[1.2] tracking-normal text-black/92 sm:text-[2.1rem]`}
      >
        {renderInlineMarkdown(block.content)}
      </h2>
    );
  }

  if (block.type === "h3") {
    return (
      <h3
        key={`h3-${index}`}
        className={`${instrumentSerif.className} mt-9 text-[1.45rem] leading-[1.24] tracking-normal text-black/90 sm:text-[1.7rem]`}
      >
        {renderInlineMarkdown(block.content)}
      </h3>
    );
  }

  if (block.type === "ul") {
    return (
      <ul key={`ul-${index}`} className="mt-6 list-disc space-y-2 pl-6">
        {block.items.map((item, itemIndex) => (
          <li
            key={`ul-item-${index}-${itemIndex}`}
            className={`${interClassName} text-[1.01rem] leading-[1.9] text-black/82 sm:text-[1.08rem]`}
          >
            {renderInlineMarkdown(item)}
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === "ol") {
    return (
      <ol key={`ol-${index}`} className="mt-6 list-decimal space-y-2 pl-6">
        {block.items.map((item, itemIndex) => (
          <li
            key={`ol-item-${index}-${itemIndex}`}
            className={`${interClassName} text-[1.01rem] leading-[1.9] text-black/82 sm:text-[1.08rem]`}
          >
            {renderInlineMarkdown(item)}
          </li>
        ))}
      </ol>
    );
  }

  if (block.type === "p") {
    return (
      <p
        key={`p-${index}`}
        className={`${interClassName} mt-6 text-[1.03rem] leading-[1.95] tracking-normal text-black/82 sm:text-[1.1rem]`}
      >
        {renderInlineMarkdown(block.content)}
      </p>
    );
  }

  return null;
}

export default async function CookiePolicyPage() {
  const cookiePolicyMarkdown = await getCookiePolicyHtml();
  const blocks = toMarkdownBlocks(cookiePolicyMarkdown);
  const { lastUpdated, contentBlocks } = extractLegalDocumentMeta(blocks);

  const socialLinks = [
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
      href: "mailto:contact@usesocratic.com",
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
    {
      label: "YouTube",
      href: "https://www.youtube.com/@useSocraticAI",
      icon: <Youtube size={14} />,
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
          <div className="grid gap-8 lg:grid-cols-[56px_minmax(0,1fr)] lg:gap-16">
            <aside className="lg:sticky lg:top-32 lg:h-fit">
              <ul className="flex items-center gap-2.5 lg:flex-col lg:items-start">
                {socialLinks.map((item) => (
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

            <div className="w-full max-w-220">
              <div className="mb-7">
                <p
                  className={`${interClassName} text-[0.76rem] font-semibold tracking-[0.14em] text-[#a01717] uppercase`}
                >
                  Legal
                </p>
                <h1
                  className={`${instrumentSerif.className} mt-3 text-[clamp(2.3rem,5.5vw,4.9rem)] leading-[1.04] tracking-normal text-black`}
                >
                  <a
                    href="https://www.usesocratic.com/"
                    className="text-[#a01717] underline decoration-[#a01717]/45 underline-offset-4 transition-colors duration-200 hover:text-[#871313] hover:decoration-[#871313]/60"
                  >
                    Socratic AI
                  </a>
                  : Cookie policy
                </h1>
                {lastUpdated ? (
                  <p
                    className={`${interClassName} mt-4 text-[1.15rem] leading-[1.55] italic text-black/78`}
                  >
                    Last updated {lastUpdated}
                  </p>
                ) : null}
              </div>

              <article className="border-t border-black/10 pt-6">
                {contentBlocks.map((block, index) => renderMarkdownBlock(block, index))}
              </article>

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
                      written. The thinking partner you never had, available even at 2
                      AM when the questions won&apos;t stop. Ask anything. Debate
                      everything.
                    </p>
                  </div>

                  <AuthAwareCtaLink
                    signedOutHref={ROUTES.SIGN_UP}
                    className={`${interClassName} inline-flex w-full min-w-62 items-center justify-center rounded-[3px] border border-[#a01717] bg-[#a01717] px-6 py-4 text-[1rem] font-semibold text-white transition-colors duration-220 hover:bg-[#8f1414] lg:w-auto`}
                  >
                    Try Socratic AI Now
                  </AuthAwareCtaLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer interClassName={interClassName} sectionPrefix={ROUTES.HOME} />
    </main>
  );
}
