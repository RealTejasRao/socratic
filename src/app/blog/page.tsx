import type { Metadata, Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { Instrument_Serif, Inter } from "next/font/google";
import { ChevronDown } from "lucide-react";
import { StaggeredMenu } from "@/src/components/home/staggered-menu";
import { LoadGate } from "@/src/components/ui/load-gate";
import {
  resolveCloudinaryPublicAsset,
  resolveOptimizedCloudinaryPublicAsset,
} from "@/src/lib/cloudinary-public-assets";
import { ROUTES } from "@/src/lib/routes";
import { createPageMetadata } from "@/src/lib/seo";
import {
  getAllBlogPostSummaries,
  type BlogSortOrder,
} from "@/src/server/blog/posts";

export const metadata: Metadata = createPageMetadata({
  title: "Socratic AI Blog | Essays for Deep Thinking",
  description:
    "Read the Socratic AI blog for essays on philosophy, strategy, and rigorous thinking.",
  path: "/blog",
  keywords: [
    "Socratic AI blog",
    "philosophy essays",
    "strategy essays",
    "deep thinking blog",
    "Socratic dialogue writing",
  ],
});

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

const navLinks = [
  { label: "Home", href: ROUTES.HOME },
  { label: "Features", href: `${ROUTES.HOME}#features` },
  { label: "Use Cases", href: `${ROUTES.HOME}#use-cases` },
  { label: "Blog", href: ROUTES.BLOG },
  { label: "Contact", href: `${ROUTES.HOME}#contact` },
];
const blogCategories = ["All", "Philosophy", "AI & Learning", "Essays", "About"];
const sortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
] as const;

type BlogPageProps = {
  searchParams?: {
    sort?: string;
  };
};

export default function BlogPage({ searchParams }: BlogPageProps) {
  const requestedSort = searchParams?.sort?.toLowerCase();
  const sortValue: BlogSortOrder =
    requestedSort === "oldest" || requestedSort === "newest"
      ? requestedSort
      : "newest";
  const activeSortLabel =
    sortOptions.find((option) => option.value === sortValue)?.label ?? "Newest";
  const posts = getAllBlogPostSummaries(sortValue);

  return (
    <LoadGate
      fallbackClassName={`min-h-screen w-full bg-[#fefefc] ${poppinsClassName}`}
    >
      <main
        className={`relative min-h-screen overflow-hidden bg-[#fefefc] ${poppinsClassName}`}
      >
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(160,23,23,0.12)_1px,transparent_1.5px)] bg-size-[22px_22px]" />
        </div>

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
                href={ROUTES.HOME}
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

        <section className="relative h-screen w-full">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-5 pt-[16vh] text-center sm:pt-[17vh] [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:pt-[10vh]">
            <div
              className={`${instrumentSerif.className} pointer-events-auto flex flex-col items-center text-black/90`}
            >
              <h1 className="hero-load-up hero-load-up-title-1 leading-[0.95] sm:text-[clamp(2.3rem,6vw,4rem)]">
                <span className="block text-[clamp(2.55rem,10.2vw,4.55rem)] sm:inline sm:text-inherit [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:block [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:text-[clamp(2.55rem,10.2vw,4.55rem)]">
                  Socratic AI
                </span>{" "}
                <span className="block text-[clamp(2.55rem,10.2vw,4.55rem)] text-[#a01717] italic sm:inline [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:block [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:text-[clamp(2.55rem,10.2vw,4.55rem)]">
                  Blogs
                </span>
              </h1>
            </div>
          </div>

          <div className="hero-bottom-image-scroll pointer-events-none absolute inset-x-0 bottom-0 z-0">
            <div className="hero-load-up hero-load-up-image relative left-1/2 w-[102vw] max-w-none -translate-x-1/2">
              <Image
                src={resolveOptimizedCloudinaryPublicAsset("/blog/blog_hero.webp", {
                  width: 1400,
                  crop: "limit",
                  quality: "auto:good",
                })}
                alt="Socratic AI blog hero illustration about philosophy and deep thinking"
                width={1400}
                height={1400}
                sizes="100vw"
                className="block h-auto w-full object-contain object-bottom sm:hidden [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:block"
                preload
              />
              <Image
                src={resolveOptimizedCloudinaryPublicAsset("/blog/blog_hero.webp", {
                  width: 2400,
                  crop: "limit",
                  quality: "auto:good",
                })}
                alt="Socratic AI blog hero illustration about philosophy and deep thinking"
                width={2400}
                height={1200}
                sizes="100vw"
                className="hidden h-auto w-full object-contain object-bottom sm:block [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:hidden"
                preload
              />
            </div>
          </div>
        </section>

        <section className="relative z-20 px-4 pt-28 pb-16 sm:px-6 sm:pt-[9rem] sm:pb-20">
          <div className="mx-auto w-full max-w-365 px-4 py-5 sm:px-8 sm:py-8">
            <div className="space-y-2.5">
              <h2
                className={`${instrumentSerif.className} text-[2.2rem] leading-none font-normal tracking-[-0.02em] text-black/90 sm:text-[2.5rem]`}
              >
                Blog
              </h2>
              <p
                className={`${interClassName} max-w-210 text-[1.02rem] leading-relaxed font-normal text-black/62 sm:text-[1.14rem]`}
              >
                Ideas on philosophy, critical thinking, AI, learning, the future
                of human intelligence, and us!
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {blogCategories.map((category) => {
                  const isActive = category === "All";

                  return (
                    <button
                      key={category}
                      type="button"
                      className={`${interClassName} cursor-pointer rounded-[11px] border px-4 py-2 text-[0.98rem] font-medium transition-colors duration-220 sm:px-5 ${
                        isActive
                          ? "border-transparent bg-[#dfdfdd] text-black/90"
                          : "border-transparent bg-transparent text-black/86 hover:bg-[#e5e4e2] hover:text-[#a01717]"
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-start gap-2.5 lg:justify-end">
                <span
                  className={`${interClassName} text-[0.97rem] font-medium text-black/72`}
                >
                  Sort by:
                </span>
                <details className="group relative">
                  <summary
                    className={`${interClassName} inline-flex cursor-pointer list-none items-center gap-2 rounded-[11px] border border-black/10 bg-[#f4f4f3] px-4 py-2 text-[1rem] font-medium text-black/88 transition-colors duration-220 marker:content-none hover:border-[#a01717]/25 hover:bg-[#a01717] hover:text-white`}
                  >
                    {activeSortLabel}
                    <ChevronDown
                      size={16}
                      strokeWidth={2}
                      className="transition-transform duration-220 group-open:rotate-180"
                    />
                  </summary>

                  <div className="absolute right-0 z-20 mt-2 min-w-32 rounded-[11px] border border-black/10 bg-[#f4f4f3] p-1.5 shadow-[0_10px_22px_rgba(0,0,0,0.08)]">
                    {sortOptions.map((option) => {
                      const isActive = option.value === sortValue;

                      return (
                        <Link
                          key={option.value}
                          href={`${ROUTES.BLOG}?sort=${option.value}` as Route}
                          className={`${interClassName} block rounded-[8px] px-3 py-1.5 text-[0.93rem] font-medium transition-colors duration-200 ${
                            isActive
                              ? "bg-[#dfdfdd] text-black/90"
                              : "text-black/84 hover:bg-[#a01717] hover:text-white"
                          }`}
                        >
                          {option.label}
                        </Link>
                      );
                    })}
                  </div>
                </details>
              </div>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`${ROUTES.BLOG}/${post.slug}` as Route}
                  className="group block h-full"
                >
                  <article className="flex h-full flex-col overflow-hidden rounded-[14px] border border-black/7 bg-white/70 p-3.5 outline outline-1 outline-black/8 transition-all duration-220 hover:-translate-y-1 hover:border-[#a01717]/25 hover:outline-[#a01717]/30 hover:shadow-[0_16px_30px_rgba(160,23,23,0.12)]">
                    <div className="relative h-52 overflow-hidden rounded-[10px]">
                      <Image
                        src={resolveOptimizedCloudinaryPublicAsset(
                          post.coverImagePath,
                          {
                            width: 1000,
                            crop: "fill",
                            quality: "auto:good",
                          },
                        )}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-450 ease-out group-hover:scale-[1.03]"
                      />
                    </div>

                    <div className="mt-3 flex flex-1 flex-col">
                      <span className="inline-flex rounded-[6px] bg-[#243140] px-2.5 py-1 text-[0.77rem] font-medium tracking-[0.01em] text-[#fefefc]">
                        {post.category}
                      </span>

                      <h3
                        className={`${instrumentSerif.className} mt-2.5 text-[1.85rem] leading-[1.18] font-normal tracking-[-0.01em] text-black/90 transition-colors duration-220 group-hover:text-[#a01717]`}
                      >
                        {post.title}
                      </h3>

                      <p
                        className={`${interClassName} mt-auto pt-2 text-[0.9rem] text-black/58`}
                      >
                        {post.author} • {post.readTimeLabel}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </LoadGate>
  );
}
