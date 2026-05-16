import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Instrument_Serif, Inter } from "next/font/google";
import { Instagram, Linkedin, Mail, Youtube } from "lucide-react";
import { Footer } from "@/src/components/home/footer";
import { StaggeredMenu } from "@/src/components/home/staggered-menu";
import { resolveCloudinaryPublicAsset } from "@/src/lib/cloudinary-public-assets";
import { HOME_HERO_URL } from "@/src/lib/home-hero";
import { ROUTES } from "@/src/lib/routes";
import { createPageMetadata } from "@/src/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Terms & Conditions",
  description:
    "Read Socratic AI's Terms & Conditions for the rules, responsibilities, and legal terms governing use of our services.",
  path: "/terms",
  index: false,
  follow: true,
});

async function getTermsMarkdown() {
  const policyPath = path.join(
    process.cwd(),
    "public",
    "legal",
    "terms-and-conditions.md",
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

const navLinks = [
  { label: "Home", href: ROUTES.HOME },
  { label: "Features", href: `${ROUTES.HOME}#features` },
  { label: "Use Cases", href: `${ROUTES.HOME}#use-cases` },
  { label: "Blog", href: ROUTES.BLOG },
  { label: "Contact", href: `${ROUTES.HOME}#contact` },
];

type MarkdownBlock =
  | { type: "hr" }
  | { type: "h1" | "h2" | "h3" | "p"; content: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

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

function splitMarkdownTableRow(line: string): string[] {
  const normalized = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return normalized.split("|").map((cell) => cell.trim());
}

function isTableSeparatorLine(line: string) {
  const cells = splitMarkdownTableRow(line);
  if (cells.length === 0) {
    return false;
  }
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
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

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? "";

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const nextLine = lines[index + 1]?.trim() ?? "";
    if (line.startsWith("|") && nextLine.startsWith("|") && isTableSeparatorLine(nextLine)) {
      flushParagraph();
      flushList();

      const headers = splitMarkdownTableRow(line);
      const rows: string[][] = [];
      index += 2;

      while (index < lines.length) {
        const rowLine = lines[index]?.trim() ?? "";
        if (!rowLine.startsWith("|")) {
          index -= 1;
          break;
        }
        rows.push(splitMarkdownTableRow(rowLine));
        index += 1;
      }

      blocks.push({ type: "table", headers, rows });
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

function toHeadingSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function renderInlineMarkdown(text: string) {
  const tokens: ReactNode[] = [];
  const pattern =
    /(\[([^\]]+)\]\(((?:https?:\/\/|mailto:|#|\/)[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|(https?:\/\/[^\s)]+)|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}))/;
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
          key={`url-${tokenIndex}`}
          href={match[7]}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 underline decoration-blue-600 underline-offset-3 transition-colors duration-200 hover:text-blue-700 hover:decoration-blue-700"
        >
          {match[7]}
        </a>,
      );
    } else if (match[8]) {
      tokens.push(
        <a
          key={`email-${tokenIndex}`}
          href={`mailto:${match[8]}`}
          className="text-blue-600 underline decoration-blue-600 underline-offset-3 transition-colors duration-200 hover:text-blue-700 hover:decoration-blue-700"
        >
          {match[8]}
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
        id={toHeadingSlug(block.content)}
        key={`h1-${index}`}
        className={`${instrumentSerif.className} mt-2 text-[2.35rem] leading-[1.08] tracking-normal text-black sm:text-[3rem] scroll-mt-28`}
      >
        {renderInlineMarkdown(block.content)}
      </h1>
    );
  }

  if (block.type === "h2") {
    return (
      <h2
        id={toHeadingSlug(block.content)}
        key={`h2-${index}`}
        className={`${instrumentSerif.className} mt-12 text-[1.8rem] leading-[1.2] tracking-normal text-black/92 sm:text-[2.1rem] scroll-mt-28`}
      >
        {renderInlineMarkdown(block.content)}
      </h2>
    );
  }

  if (block.type === "h3") {
    return (
      <h3
        id={toHeadingSlug(block.content)}
        key={`h3-${index}`}
        className={`${instrumentSerif.className} mt-9 text-[1.45rem] leading-[1.24] tracking-normal text-black/90 sm:text-[1.7rem] scroll-mt-28`}
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

  if (block.type === "table") {
    return (
      <div
        key={`table-${index}`}
        className="mt-6 overflow-x-auto rounded-xl border border-black/12"
      >
        <table className="min-w-full border-collapse text-left">
          <thead>
            <tr className="bg-black/4">
              {block.headers.map((header, headerIndex) => (
                <th
                  key={`th-${index}-${headerIndex}`}
                  className={`${interClassName} border-b border-black/12 px-4 py-3 text-[0.88rem] font-semibold tracking-[0.02em] text-black/86`}
                >
                  {renderInlineMarkdown(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr
                key={`tr-${index}-${rowIndex}`}
                className="align-top odd:bg-white even:bg-black/1.5"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={`td-${index}-${rowIndex}-${cellIndex}`}
                    className={`${interClassName} border-b border-black/8 px-4 py-3 text-[0.92rem] leading-[1.65] text-black/82`}
                  >
                    {renderInlineMarkdown(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

export default async function TermsPage() {
  const termsMarkdown = await getTermsMarkdown();
  const blocks = toMarkdownBlocks(termsMarkdown);
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
      <header className="fixed inset-x-0 top-0 z-50 flex flex-col border-b border-black/6 bg-white/60 px-5 py-0 backdrop-blur-md supports-backdrop-filter:bg-white/50 sm:px-7 sm:pt-1.5 sm:pb-0">
        <nav className="relative mx-auto flex h-16 w-full max-w-365 items-center justify-between sm:h-auto">
          <Link
            href={ROUTES.HOME}
            className="hero-load-up hero-load-up-nav-logo group relative flex h-11 w-fit items-center sm:h-8.5"
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
              href={HOME_HERO_URL}
              className={`${interClassName} hero-load-up hero-load-up-nav-cta inline-flex h-9 min-w-24 items-center justify-center rounded-full border border-black/18 bg-black px-5 text-[0.82rem] font-medium tracking-[0.02em] text-white transition-all duration-250 hover:-translate-y-0.5 hover:bg-black/92 sm:h-7.5 sm:min-w-22 sm:px-4.5 sm:text-[0.76rem]`}
            >
              Try Socratic AI
            </Link>

            <StaggeredMenu
              className="hero-load-up hero-load-up-nav-menu lg:hidden"
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
                  : Terms and conditions
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
                      AM when the questions won't stop. Ask anything. Debate
                      everything.
                    </p>
                  </div>

                  <Link
                    href={HOME_HERO_URL}
                    className={`${interClassName} inline-flex w-full min-w-62 items-center justify-center rounded-[3px] border border-[#a01717] bg-[#a01717] px-6 py-4 text-[1rem] font-semibold text-white transition-colors duration-220 hover:bg-[#8f1414] lg:w-auto`}
                  >
                    Try Socratic AI
                  </Link>
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
