import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { Instrument_Serif, Inter } from "next/font/google";
import { FallbackBlogImage } from "@/src/components/blog/fallback-blog-image";
import { Footer } from "@/src/components/home/footer";
import { MarketingLocaleSwitcher } from "@/src/components/navigation/marketing-locale-switcher";
import { MarketingNavbar } from "@/src/components/navigation/marketing-navbar";
import { LoadGate } from "@/src/components/ui/load-gate";
import { getBlogCopy, type BlogCopy } from "@/src/i18n/blog";
import { getHomeCopy } from "@/src/i18n/home";
import { getLocalizedPath, type SupportedLocale } from "@/src/i18n/locales";
import {
  resolveOptimizedCloudinaryPublicAsset,
} from "@/src/lib/cloudinary-public-assets";
import { ROUTES } from "@/src/lib/routes";
import {
  getAllBlogPostSummaries,
  getBlogPostBySlug,
  hasTranslatedBlogPost,
  type BlogSortOrder,
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

export type BlogPageSearchParams =
  | Promise<{
      sort?: string | string[];
      category?: string | string[];
    }>
  | {
      sort?: string | string[];
      category?: string | string[];
    };

type LocalizedBlogPageProps = {
  locale: SupportedLocale;
  searchParams?: BlogPageSearchParams | undefined;
};

type BlogCategoryCopy = BlogCopy["categories"][number];

function getFirstParamValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function slugifyCategory(category: string) {
  return category.toLowerCase().replace(/ & /g, "-and-").replace(/\s+/g, "-");
}

function getReadTimeMinutes(readTimeLabel: string) {
  return readTimeLabel.match(/\d+/)?.[0] ?? readTimeLabel;
}

function getMarkdownTitle(markdown: string) {
  const heading = markdown
    .split(/\r?\n/)
    .find((line) => line.trim().startsWith("# "));

  return heading ? heading.trim().slice(2).trim() : null;
}

export async function LocalizedBlogPage({
  locale,
  searchParams,
}: LocalizedBlogPageProps) {
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
  const homeCopy = getHomeCopy(locale);
  const blogCopy = getBlogCopy(locale);
  const homeHref = getLocalizedPath("/", locale);
  const pricingHref = getLocalizedPath("/pricing", locale);
  const billingHref = getLocalizedPath("/billing", locale);
  const blogHref = getLocalizedPath("/blog", locale);
  const categoryBySlug = new Map(
    blogCopy.categories.map((category) => [
      slugifyCategory(category.sourceLabel),
      category,
    ]),
  );
  const allCategory: BlogCategoryCopy = blogCopy.categories[0] ?? {
    id: "all",
    sourceLabel: "All",
    label: "All",
  };
  const activeCategory =
    requestedCategory && categoryBySlug.has(requestedCategory)
      ? categoryBySlug.get(requestedCategory)!
      : allCategory;
  const posts = getAllBlogPostSummaries(sortValue).filter((post) =>
    activeCategory.sourceLabel === "All"
      ? true
      : post.category === activeCategory.sourceLabel,
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
          homeHref={homeHref}
          sectionPrefix={homeHref}
          pricingHref={pricingHref}
          billingHref={billingHref}
          blogHref={blogHref}
          copy={homeCopy.nav}
          languageSwitcher={
            <MarketingLocaleSwitcher
              locale={locale}
              label={homeCopy.nav.language}
              path="/blog"
              className={`${interClassName} hero-load-up hero-load-up-nav-cta inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full outline-black outline-2 bg-transparent px-2.5 text-[0.72rem] font-medium tracking-[0.01em] text-black transition-all duration-200 hover:border-[#a01717] hover:text-[#a01717] disabled:cursor-wait disabled:opacity-65 sm:px-3.5 sm:text-[0.76rem]`}
            />
          }
        />

        <section className="relative h-screen w-full">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-5 pt-[16vh] text-center sm:pt-[17vh] [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:pt-[10vh]">
            <div
              className={`${instrumentSerif.className} pointer-events-auto flex flex-col items-center text-black/90`}
            >
              <h1 className="hero-load-up hero-load-up-title-1 leading-[0.92] sm:leading-[0.9]">
                <span className="block text-[clamp(3rem,11.2vw,5.2rem)] sm:inline sm:text-[clamp(3.2rem,7.2vw,5.2rem)] [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:block [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:text-[clamp(3rem,11.2vw,5.2rem)]">
                  {blogCopy.hero.brand}
                </span>{" "}
                <span className="block text-[clamp(3.25rem,12.2vw,5.6rem)] text-[#a01717] italic sm:inline sm:text-[clamp(3.45rem,7.9vw,5.6rem)] [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:block [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:text-[clamp(3.25rem,12.2vw,5.6rem)]">
                  {blogCopy.hero.title}
                </span>
              </h1>
              <p
                className={`${interClassName} hero-load-up hero-load-up-hero-copy mt-2.5 max-w-[36rem] px-2 text-[0.8rem] leading-relaxed text-black/68 sm:mt-3 sm:max-w-[44rem] sm:text-[0.9rem]`}
              >
                {blogCopy.hero.description}
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
                alt={blogCopy.hero.imageAlt}
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
                alt={blogCopy.hero.imageAlt}
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
                {blogCopy.listing.heading}
              </h2>
              <p
                className={`${interClassName} max-w-210 text-[1.02rem] leading-relaxed font-normal text-black/62 sm:text-[1.14rem]`}
              >
                {blogCopy.listing.description}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {blogCopy.categories.map((category) => {
                  const isActive = category.id === activeCategory.id;
                  const categorySlug = slugifyCategory(category.sourceLabel);
                  const href =
                    category.sourceLabel === "All"
                      ? (`${blogHref}?sort=${sortValue}` as Route)
                      : (`${blogHref}?sort=${sortValue}&category=${categorySlug}` as Route);

                  return (
                    <Link
                      key={category.id}
                      href={href}
                      scroll={false}
                      className={`${interClassName} cursor-pointer rounded-[11px] border px-4 py-2 text-[0.98rem] font-medium transition-colors duration-220 sm:px-5 ${
                        isActive
                          ? "border-transparent bg-[#a01717] text-white"
                          : "border-transparent bg-transparent text-black/86 hover:bg-[#e5e4e2] hover:text-[#a01717]"
                      }`}
                    >
                      {category.label}
                    </Link>
                  );
                })}
              </div>

              <div className="flex items-center justify-start gap-2.5 lg:justify-end">
                <span
                  className={`${interClassName} text-[0.97rem] font-medium text-black/72`}
                >
                  {blogCopy.listing.sortBy}
                </span>
                <div className="inline-flex items-center gap-1 rounded-[11px] border border-black/10 bg-[#f4f4f3] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                  {(["newest", "oldest"] as const).map((option) => {
                    const isActive = option === sortValue;
                    const categoryQuery =
                      activeCategory.sourceLabel === "All"
                        ? ""
                        : `&category=${slugifyCategory(activeCategory.sourceLabel)}`;

                    return (
                      <Link
                        key={option}
                        href={`${blogHref}?sort=${option}${categoryQuery}` as Route}
                        scroll={false}
                        className={`${interClassName} rounded-xl border px-3 py-1.5 text-[0.93rem] font-medium transition-all duration-300 ease-out ${
                          isActive
                            ? "border-[#8a1414] bg-[#a01717] text-white shadow-[0_3px_10px_rgba(160,23,23,0.3)]"
                            : "border-transparent text-black/84 hover:border-[#992424]/35 hover:bg-[#c34545] hover:text-white"
                        }`}
                      >
                        {blogCopy.sortOptions[option]}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => {
                const category = blogCopy.categories.find(
                  (item) => item.sourceLabel === post.category,
                );
                const readTime = blogCopy.listing.readTime.replace(
                  "{minutes}",
                  getReadTimeMinutes(post.readTimeLabel),
                );
                const postHref =
                  locale === "en" || !hasTranslatedBlogPost(post.slug, locale)
                    ? (`${ROUTES.BLOG}/${post.slug}` as Route)
                    : getLocalizedPath(`/blog/${post.slug}`, locale);
                const localizedPost =
                  locale === "en" ? null : getBlogPostBySlug(post.slug, locale);
                const displayTitle = localizedPost
                  ? (getMarkdownTitle(localizedPost.markdown) ?? post.title)
                  : post.title;

                return (
                  <Link
                    key={post.slug}
                    href={postHref}
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
                          alt={displayTitle}
                          sizes="(min-width: 1280px) 31vw, (min-width: 640px) 46vw, 92vw"
                          className="object-cover transition-transform duration-450 ease-out group-hover:scale-[1.03]"
                        />
                      </div>

                      <div className="mt-3 flex flex-1 flex-col">
                        <span className="inline-flex self-start rounded-[6px] bg-[#243140] px-2.5 py-1 text-[0.77rem] font-medium tracking-[0.01em] text-[#fefefc]">
                          {category?.label ?? post.category}
                        </span>

                        <h3
                          className={`${instrumentSerif.className} mt-2.5 text-[1.85rem] leading-[1.18] font-normal tracking-[-0.01em] text-black/90 transition-colors duration-220 group-hover:text-[#a01717]`}
                        >
                          {displayTitle}
                        </h3>

                        <p
                          className={`${interClassName} mt-auto pt-2 text-[0.9rem] text-black/58`}
                        >
                          {post.authorUrl ? (
                            <span
                              className="relative z-10 text-black/62 transition-colors hover:text-[#a01717]"
                            >
                              {post.author}
                            </span>
                          ) : (
                            post.author
                          )}{" "}
                          - {readTime}
                        </p>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <Footer
          interClassName={interClassName}
          sectionPrefix={homeHref}
          pricingHref={pricingHref}
          billingHref={billingHref}
          blogHref={blogHref}
          copy={homeCopy.footer}
        />
      </main>
    </LoadGate>
  );
}
