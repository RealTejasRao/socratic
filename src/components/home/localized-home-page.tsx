import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Instrument_Serif, Inter } from "next/font/google";
import { auth } from "@clerk/nextjs/server";
import { LoadGate } from "@/src/components/ui/load-gate";
import { FeaturesSection } from "@/src/components/home/features-section";
import { HomeHashScroll } from "@/src/components/home/home-hash-scroll";
import { SecuritySeparator } from "@/src/components/home/security-separator";
import { UseCasesSection } from "@/src/components/home/use-cases-section";
import { ContactSection } from "@/src/components/home/contact-section";
import { Footer } from "@/src/components/home/footer";
import { HeroRotatingWord } from "@/src/components/home/hero-rotating-word";
import { AuthAwareCtaLink } from "@/src/components/navigation/auth-aware-cta-link";
import { MarketingLocaleSwitcher } from "@/src/components/navigation/marketing-locale-switcher";
import { MarketingNavbar } from "@/src/components/navigation/marketing-navbar";
import { TwaHomeShell } from "@/src/components/pwa/twa-home-shell";
import {
  resolveOptimizedCloudinaryPublicAsset,
} from "@/src/lib/cloudinary-public-assets";
import { ROUTES } from "@/src/lib/routes";
import { HOME_HERO_ID } from "@/src/lib/home-hero";
import { getHomeCopy } from "@/src/i18n/home";
import {
  getHomePathForLocale,
  getLocalizedPath,
  type SupportedLocale,
} from "@/src/i18n/locales";

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

export async function LocalizedHomePage({
  locale,
}: {
  locale: SupportedLocale;
}) {
  const { userId: clerkUserId } = await auth();
  const copy = getHomeCopy(locale);
  const homeHref = getHomePathForLocale(locale);
  const pricingHref = getLocalizedPath("/pricing", locale);
  const billingHref = getLocalizedPath("/billing", locale);
  const blogHref = getLocalizedPath("/blog", locale);

  return (
    <LoadGate
      fallbackClassName={`min-h-screen w-full bg-[#fefefc] ${poppinsClassName}`}
    >
      <main
        id="home"
        className={`relative min-h-screen overflow-hidden bg-[#fefefc] ${poppinsClassName}`}
      >
        <div className="pwa-browser-only">
          <div className="pointer-events-none absolute inset-0 opacity-50">
            <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(160,23,23,0.12)_1px,transparent_1.5px)] bg-size-[22px_22px]" />
          </div>
          <HomeHashScroll />
          <MarketingNavbar
            interClassName={interClassName}
            instrumentSerifClassName={instrumentSerif.className}
            homeHref={homeHref}
            pricingHref={pricingHref}
            billingHref={billingHref}
            blogHref={blogHref}
            copy={copy.nav}
            languageSwitcher={
              <MarketingLocaleSwitcher
                locale={locale}
                label={copy.nav.language}
                className={`${interClassName} hero-load-up hero-load-up-nav-cta inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full outline-black outline-2 bg-transparent px-2.5 text-[0.72rem] font-medium tracking-[0.01em] text-black transition-all duration-200 hover:border-[#a01717] hover:text-[#a01717] disabled:cursor-wait disabled:opacity-65 sm:px-3.5 sm:text-[0.76rem]`}
              />
            }
          />

          <section id={HOME_HERO_ID} className="relative h-screen w-full">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-5 pt-28 text-center sm:px-7 sm:pt-[7.1rem]">
              <div
                className={`${instrumentSerif.className} pointer-events-auto flex flex-col items-center text-black/90`}
              >
                <h1 className="hero-load-up hero-load-up-title-1 leading-[1.03] sm:leading-[0.96] sm:text-[clamp(1.45rem,4vw,2.35rem)]">
                  <span className="sr-only">{copy.hero.srOnly}</span>
                  <span className="block text-[clamp(1.95rem,7.6vw,2.7rem)] sm:inline sm:text-inherit [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:block [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:text-[clamp(1.95rem,7.6vw,2.7rem)]">
                    {copy.hero.headlinePrefix}
                  </span>{" "}
                  <span
                    className="mt-2.5 block text-[clamp(2.95rem,11.2vw,4.2rem)] sm:hidden [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:block"
                    aria-hidden="true"
                  >
                    <HeroRotatingWord align="center" words={copy.hero.words} />
                  </span>
                  <span
                    className="hidden sm:inline [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:hidden"
                    aria-hidden="true"
                  >
                    <HeroRotatingWord words={copy.hero.words} />
                  </span>
                </h1>
                <div className="hero-load-up hero-load-up-hero-cta mt-8 w-full px-1 sm:mt-7 sm:px-4">
                  <AuthAwareCtaLink
                    signedOutHref={ROUTES.APP_ROLEPLAY}
                    showPendingStateOnNavigate
                    pendingIndicator="roseCurve"
                    className={`${interClassName} group inline-flex min-h-12 min-w-62 items-center justify-center gap-2 rounded-full outline outline-[#a01717] bg-transparent px-6 py-2 text-[0.82rem] font-semibold tracking-[0.06em] text-[#a01717] transition-all duration-250 hover:bg-[#a01717] hover:text-white sm:min-h-10.5 sm:min-w-57 sm:text-[0.79rem]`}
                    signedOutChildren={
                      <>
                        <span>{copy.hero.signedOutCta}</span>
                        <ArrowRight
                          aria-hidden="true"
                          className="hero-cta-arrow-loop h-[0.9rem] w-[0.9rem]"
                          strokeWidth={2.3}
                        />
                      </>
                    }
                  >
                    <span>{copy.hero.signedInCta}</span>
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
                    "/home/hero_m_final.webp",
                    {
                      width: 750,
                      crop: "limit",
                      quality: "auto:good",
                    },
                  )}
                  alt={copy.hero.mobileImageAlt}
                  width={750}
                  height={50}
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) and (orientation: portrait) 100vw, 0px"
                  className="home-hero-mobile-image block h-auto w-full object-contain object-bottom sm:hidden [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:block"
                  preload
                />
                <Image
                  src={resolveOptimizedCloudinaryPublicAsset("/home/hero.webp", {
                    width: 2400,
                    crop: "limit",
                    quality: "auto:good",
                  })}
                  alt={copy.hero.desktopImageAlt}
                  width={2400}
                  height={1200}
                  sizes="(max-width: 639px) 0px, (max-width: 1023px) and (orientation: portrait) 0px, 100vw"
                  className="hidden h-auto w-full object-contain object-bottom sm:block [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:hidden"
                  preload
                />
              </div>
            </div>
          </section>

          <FeaturesSection
            interClassName={interClassName}
            headingSubject={copy.features.headingSubject}
            headingText={copy.features.headingText}
            highlightedTerms={copy.features.highlightedTerms}
            cardCopy={copy.features.cards}
          />
          <SecuritySeparator
            interClassName={interClassName}
            message={copy.security.message}
            highlightedTerm={copy.security.highlightedTerm}
            ariaLabel={copy.security.ariaLabel}
          />
          <UseCasesSection
            interClassName={interClassName}
            headingText={copy.useCases.headingText}
            mobileFirstLineText={copy.useCases.mobileFirstLine}
            mobileSecondLineText={copy.useCases.mobileSecondLine}
            highlightedWord={copy.useCases.highlightedWord}
            itemCopy={copy.useCases.items}
          />
          <ContactSection interClassName={interClassName} copy={copy.contact} />
          <Footer
            interClassName={interClassName}
            sectionPrefix={homeHref}
            pricingHref={pricingHref}
            billingHref={billingHref}
            blogHref={blogHref}
            copy={copy.footer}
          />
        </div>

        <TwaHomeShell
          isSignedIn={Boolean(clerkUserId)}
          copy={copy.standalone}
        />
      </main>
    </LoadGate>
  );
}
