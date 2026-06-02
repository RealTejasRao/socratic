import type { Metadata, Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { FallbackBlogImage } from "@/src/components/blog/fallback-blog-image";
import { Instrument_Serif, Inter } from "next/font/google";
import { Footer } from "@/src/components/home/footer";
import { MarketingNavbar } from "@/src/components/navigation/marketing-navbar";
import { LoadGate } from "@/src/components/ui/load-gate";
import {
  resolveOptimizedCloudinaryPublicAsset,
} from "@/src/lib/cloudinary-public-assets";
import { ROUTES } from "@/src/lib/routes";
import { createPageMetadata } from "@/src/lib/seo";
import {
  getAllBlogPostSummaries,
  type BlogSortOrder,
} from "@/src/server/blog/posts";

export const metadata: Metadata = createPageMetadata({
  title: "Socratic AI Blogs | Philosophy, AI & Critical Thinking",
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

const blogCategories = ["All", "Philosophy", "AI & Learning", "Essays", "About"];
const sortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
] as const;

type BlogPageProps = {
  searchParams?:
    | Promise<{
        sort?: string | string[];
        category?: string | string[];
      }>
    | {
        sort?: string | string[];
        category?: string | string[];
      };
};

function getFirstParamValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function slugifyCategory(category: string) {
  return category.toLowerCase().replace(/ & /g, "-and-").replace(/\s+/g, "-");
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const resolvedSearchParams =
    searchParams && "then" in searchParams ? await searchParams : searchParams;
  const requestedSort = getFirstParamValue(resolvedSearchParams?.sort)
    ?.toLowerCase()
    .trim();
  const requestedCategory = getFirstParamValue(resolvedSearchParams?.category)
    ?.toLowerCase()
    .trim();
  const sortValue: BlogSortOrder =
    requestedSort === "oldest" || requestedSort === "newest"
      ? requestedSort
      : "newest";
  const categoryBySlug = new Map(
    blogCategories.map((category) => [slugifyCategory(category), category]),
  );
  const activeCategory =
    requestedCategory && categoryBySlug.has(requestedCategory)
      ? categoryBySlug.get(requestedCategory)!
      : "All";
  const posts = getAllBlogPostSummaries(sortValue).filter((post) =>
    activeCategory === "All" ? true : post.category === activeCategory,
  );

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

        <MarketingNavbar
          interClassName={interClassName}
          instrumentSerifClassName={instrumentSerif.className}
          sectionPrefix={ROUTES.HOME}
        />

        <section className="relative h-screen w-full">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-5 pt-[16vh] text-center sm:pt-[17vh] [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:pt-[10vh]">
            <div
              className={`${instrumentSerif.className} pointer-events-auto flex flex-col items-center text-black/90`}
            >
              <h1 className="hero-load-up hero-load-up-title-1 leading-[0.92] sm:leading-[0.9]">
                <span className="block text-[clamp(3rem,11.2vw,5.2rem)] sm:inline sm:text-[clamp(3.2rem,7.2vw,5.2rem)] [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:block [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:text-[clamp(3rem,11.2vw,5.2rem)]">
                  Socratic AI
                </span>{" "}
                <span className="block text-[clamp(3.25rem,12.2vw,5.6rem)] text-[#a01717] italic sm:inline sm:text-[clamp(3.45rem,7.9vw,5.6rem)] [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:block [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:text-[clamp(3.25rem,12.2vw,5.6rem)]">
                  Blogs
                </span>
              </h1>
              <p
                className={`${interClassName} hero-load-up hero-load-up-hero-copy mt-2.5 max-w-[36rem] px-2 text-[0.8rem] leading-relaxed text-black/68 sm:mt-3 sm:max-w-[44rem] sm:text-[0.9rem]`}
              >
                Ideas on philosophy, critical thinking, AI, learning, the future
                of human intelligence, and us!
              </p>
            </div>
          </div>

          <div className="hero-bottom-image-scroll pointer-events-none absolute inset-x-0 bottom-0 z-0">
            <div className="hero-load-up hero-load-up-image relative left-1/2 w-[102vw] max-w-none -translate-x-1/2">
              <Image
                src={resolveOptimizedCloudinaryPublicAsset(
                  "/blog/blog_bg_mobile.webp",
                  {
                    width: 1400,
                    crop: "limit",
                    quality: "auto:good",
                  },
                )}
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

        <section className="relative z-20 px-4 pt-28 pb-16 sm:px-6 sm:pt-36 sm:pb-20">
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
                  const isActive = category === activeCategory;
                  const categorySlug = slugifyCategory(category);
                  const href =
                    category === "All"
                      ? (`${ROUTES.BLOG}?sort=${sortValue}` as Route)
                      : (`${ROUTES.BLOG}?sort=${sortValue}&category=${categorySlug}` as Route);

                  return (
                    <Link
                      key={category}
                      href={href}
                      scroll={false}
                      className={`${interClassName} cursor-pointer rounded-[11px] border px-4 py-2 text-[0.98rem] font-medium transition-colors duration-220 sm:px-5 ${
                        isActive
                          ? "border-transparent bg-[#a01717] text-white"
                          : "border-transparent bg-transparent text-black/86 hover:bg-[#e5e4e2] hover:text-[#a01717]"
                      }`}
                    >
                      {category}
                    </Link>
                  );
                })}
              </div>

              <div className="flex items-center justify-start gap-2.5 lg:justify-end">
                <span
                  className={`${interClassName} text-[0.97rem] font-medium text-black/72`}
                >
                  Sort by:
                </span>
                <div className="inline-flex items-center gap-1 rounded-[11px] border border-black/10 bg-[#f4f4f3] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                  {sortOptions.map((option) => {
                    const isActive = option.value === sortValue;
                    const categoryQuery =
                      activeCategory === "All"
                        ? ""
                        : `&category=${slugifyCategory(activeCategory)}`;

                    return (
                      <Link
                        key={option.value}
                        href={`${ROUTES.BLOG}?sort=${option.value}${categoryQuery}` as Route}
                        scroll={false}
                        className={`${interClassName} rounded-xl border px-3 py-1.5 text-[0.93rem] font-medium transition-all duration-300 ease-out ${
                          isActive
                            ? "border-[#8a1414] bg-[#a01717] text-white shadow-[0_3px_10px_rgba(160,23,23,0.3)]"
                            : "border-transparent text-black/84 hover:border-[#992424]/35 hover:bg-[#c34545] hover:text-white"
                        }`}
                      >
                        {option.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`${ROUTES.BLOG}/${post.slug}` as Route}
                  className="group block h-full"
                >
                  <article className="flex h-full flex-col overflow-hidden rounded-[14px] border border-black/7 bg-white/70 p-3.5 outline outline-black/8 transition-all duration-220 hover:-translate-y-1 hover:border-[#a01717]/25 hover:outline-[#a01717]/30 hover:shadow-[0_16px_30px_rgba(160,23,23,0.12)]">
                    <div className="relative h-52 overflow-hidden rounded-[10px]">
                      <FallbackBlogImage
                        src={resolveOptimizedCloudinaryPublicAsset(
                          post.coverImagePath,
                          {
                            width: 1000,
                            crop: "fill",
                            quality: "auto:good",
                          },
                        )}
                        fallbackSrc={post.coverImagePath}
                        alt={post.title}
                        sizes="(min-width: 1280px) 31vw, (min-width: 640px) 46vw, 92vw"
                        className="object-cover transition-transform duration-450 ease-out group-hover:scale-[1.03]"
                      />
                    </div>

                    <div className="mt-3 flex flex-1 flex-col">
                      <span className="inline-flex self-start rounded-[6px] bg-[#243140] px-2.5 py-1 text-[0.77rem] font-medium tracking-[0.01em] text-[#fefefc]">
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

        <Footer interClassName={interClassName} sectionPrefix={ROUTES.HOME} />
      </main>
    </LoadGate>
  );
}
