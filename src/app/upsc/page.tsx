import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Instrument_Serif, Inter } from "next/font/google";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { LoadGate } from "@/src/components/ui/load-gate";
import { HomeHashScroll } from "@/src/components/home/home-hash-scroll";
import { Footer } from "@/src/components/home/footer";
import { HeroRotatingWord } from "@/src/components/home/hero-rotating-word";
import { AuthAwareCtaLink } from "@/src/components/navigation/auth-aware-cta-link";
import { MarketingNavbar } from "@/src/components/navigation/marketing-navbar";
import { TwaHomeShell } from "@/src/components/pwa/twa-home-shell";
import {
  resolveOptimizedCloudinaryPublicAsset,
} from "@/src/lib/cloudinary-public-assets";
import { ROUTES } from "@/src/lib/routes";
import { createPageMetadata } from "@/src/lib/seo";
import { HOME_HERO_ID } from "@/src/lib/home-hero";
import {
  getUpscHomeCopy,
  resolveUpscHomeLocale,
  UPSC_HOME_LOCALE_COOKIE,
} from "@/src/lib/upsc-home-locale";
import { UpscHomeLocalizedSections } from "./UpscHomeLocalizedSections";

export const metadata: Metadata = createPageMetadata({
  title: "Socratic AI | Philosophy, Critical Thinking & Deep Conversations",
  description:
    "Socratic AI: An AI thinking partner for philosophy, critical thinking, and deep conversation. Built on Socratic dialogue, it challenges your reasoning, sharpens your arguments, and helps you think more clearly.",
  path: "/upsc",
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
type UpscPageProps = {
  searchParams?:
    | Promise<{
        lang?: string | string[];
      }>
    | {
        lang?: string | string[];
      };
};

function getFirstParamValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({ searchParams }: UpscPageProps) {
  const resolvedSearchParams =
    searchParams && "then" in searchParams ? await searchParams : searchParams;
  const cookieStore = await cookies();
  const locale = resolveUpscHomeLocale(
    getFirstParamValue(resolvedSearchParams?.lang) ??
      cookieStore.get(UPSC_HOME_LOCALE_COOKIE)?.value,
  );
  const copy = getUpscHomeCopy(locale);

  const { userId: clerkUserId } = await auth();

  return (
    <LoadGate
      fallbackClassName={`min-h-screen w-full bg-[#fefefc] ${poppinsClassName}`}
    >
      <main
        id="home"
        className={`relative min-h-screen overflow-hidden bg-[#fefefc] ${poppinsClassName}`}
      >
        <div className="pwa-browser-only">
          <div className="pointer-events-none absolute inset-x-0 top-[100vh] bottom-0 opacity-50">
            <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(160,23,23,0.12)_1px,transparent_1.5px)] bg-size-[22px_22px]" />
          </div>
          <HomeHashScroll />
          <MarketingNavbar
            interClassName={interClassName}
            instrumentSerifClassName={instrumentSerif.className}
            homeHref="#"
            appHref={ROUTES.UPSC_APP_SOCRATIC}
            appSignedOutHref={ROUTES.UPSC_APP_SOCRATIC}
            locale={locale}
            copy={copy.nav}
          />

          <section id={HOME_HERO_ID} className="relative h-screen w-full bg-white">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-5 pt-25 text-center sm:px-7 sm:pt-[5.8rem]">
              <div
                className={`${instrumentSerif.className} pointer-events-auto flex w-full max-w-[76rem] flex-col items-center text-black/90`}
              >
                <h1
                  className={`hero-load-up hero-load-up-title-1 text-center leading-[1.06] sm:leading-[1] ${
                    locale === "hi"
                      ? "sm:text-[clamp(0.98rem,2.35vw,1.38rem)]"
                      : "sm:text-[clamp(1.12rem,2.92vw,1.72rem)]"
                  }`}
                >
                  <span className="sr-only">
                    {copy.hero.srOnly}
                  </span>
                  <span
                    className={`block sm:inline sm:text-inherit [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:block ${
                      locale === "hi"
                        ? "text-[clamp(1.3rem,5.35vw,1.78rem)] [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:text-[clamp(1.3rem,5.35vw,1.78rem)]"
                        : "text-[clamp(1.55rem,6.4vw,2.15rem)] [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:text-[clamp(1.55rem,6.4vw,2.15rem)]"
                    }`}
                  >
                    {copy.hero.headlinePrefix}
                  </span>{" "}
                  <span
                    className={`mt-2 block sm:hidden [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:block ${
                      locale === "hi"
                        ? "text-[clamp(1.85rem,7.5vw,2.55rem)]"
                        : "text-[clamp(2.2rem,9.2vw,3.2rem)]"
                    }`}
                    aria-hidden="true"
                  >
                    <HeroRotatingWord
                      align="center"
                      words={copy.hero.words}
                      className="text-[1.24em]"
                    />
                  </span>
                  <span
                    className="hidden sm:inline [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:hidden"
                    aria-hidden="true"
                  >
                    <HeroRotatingWord
                      words={copy.hero.words}
                      className="text-[1.24em]"
                    />
                  </span>
                  {copy.hero.headlineSuffix ? (
                    <>
                      {" "}
                      <span>{copy.hero.headlineSuffix}</span>
                    </>
                  ) : null}
                </h1>
                <p
                  className={`${interClassName} hero-load-up hero-load-up-title-1 mx-auto mt-3 w-full max-w-[38rem] px-4 text-center text-[0.76rem] font-normal leading-5 text-black/45 sm:mt-3 sm:text-[0.84rem]`}
                >
                  {copy.hero.subheading}
                </p>
                <div className="hero-load-up hero-load-up-hero-cta mt-7 w-full px-1 sm:mt-7 sm:px-4">
                  <AuthAwareCtaLink
                    signedInHref={ROUTES.UPSC_APP_SOCRATIC}
                    signedOutHref={ROUTES.UPSC_APP_SOCRATIC}
                    showPendingStateOnNavigate
                    pendingIndicator="roseCurve"
                    className={`${interClassName} group inline-flex min-h-12 min-w-62 items-center justify-center gap-2 rounded-full outline outline-[#a01717] bg-transparent px-6 py-2 text-[0.82rem] font-semibold tracking-[0.06em] text-[#a01717] transition-all duration-250 hover:bg-[#a01717] hover:text-white sm:min-h-10.5 sm:min-w-57 sm:text-[0.79rem]`}
                    signedOutChildren={
                      <>
                        <span>{copy.hero.cta}</span>
                        <ArrowRight
                          aria-hidden="true"
                          className="hero-cta-arrow-loop h-[0.9rem] w-[0.9rem]"
                          strokeWidth={2.3}
                        />
                      </>
                    }
                  >
                    <span>{copy.hero.cta}</span>
                    <ArrowRight
                      aria-hidden="true"
                      className="hero-cta-arrow-loop h-[0.9rem] w-[0.9rem]"
                      strokeWidth={2.3}
                    />
                  </AuthAwareCtaLink>
                </div>
              </div>
            </div>

            <div className="hero-bottom-image-scroll pointer-events-none absolute inset-x-0 bottom-0 z-0">
              <div className="hero-load-up hero-load-up-image w-full">
                <Image
                  src={resolveOptimizedCloudinaryPublicAsset(
                    "/upsc/upsc-m-final.webp",
                    {
                      width: 750,
                      crop: "limit",
                      quality: "auto:good",
                    },
                  )}
                  alt="Socratic AI hero illustration for philosophy and strategic thinking"
                  width={750}
                  height={50}
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) and (orientation: portrait) 100vw, 0px"
                  className="home-hero-mobile-image block h-auto w-full object-contain object-bottom sm:hidden [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:block"
                  preload
                />
                <Image
                  src={resolveOptimizedCloudinaryPublicAsset("/upsc/upsc-hero.webp", {
                    width: 2400,
                    crop: "limit",
                    quality: "auto:good",
                  })}
                  alt="Socratic AI hero illustration for philosophy and strategic thinking"
                  width={2400}
                  height={1200}
                  sizes="(max-width: 639px) 0px, (max-width: 1023px) and (orientation: portrait) 0px, 100vw"
                  className="hidden h-auto w-full object-contain object-bottom sm:block [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:hidden"
                  preload
                />
              </div>
            </div>
          </section>

          <UpscHomeLocalizedSections
            interClassName={interClassName}
            locale={locale}
          />
          <Footer
            interClassName={interClassName}
            descriptionLines={[...copy.footer.descriptionLines]}
            ctaLabel={copy.footer.cta}
            ctaSignedInHref={ROUTES.UPSC_APP_SOCRATIC}
            ctaSignedOutHref={ROUTES.UPSC_APP_SOCRATIC}
            appHref={ROUTES.UPSC_APP_SOCRATIC}
            copy={copy.footer}
          />
        </div>

        <TwaHomeShell
          isSignedIn={Boolean(clerkUserId)}
          appHref={ROUTES.UPSC_APP_SOCRATIC}
        />
      </main>
    </LoadGate>
  );
}
