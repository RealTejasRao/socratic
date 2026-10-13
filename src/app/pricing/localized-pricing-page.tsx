import { auth } from "@clerk/nextjs/server";
import { Instrument_Serif, Inter } from "next/font/google";
import { Footer } from "@/src/components/home/footer";
import { MarketingLocaleSwitcher } from "@/src/components/navigation/marketing-locale-switcher";
import { MarketingNavbar } from "@/src/components/navigation/marketing-navbar";
import { LoadGate } from "@/src/components/ui/load-gate";
import { getHomeCopy } from "@/src/i18n/home";
import { getLocalizedPath, type SupportedLocale } from "@/src/i18n/locales";
import { getPricingCopy } from "@/src/i18n/pricing";
import { prisma } from "@/src/server/db/client";
import { getUserBillingStateByClerkId } from "@/src/server/billing/access";
import PricingCards from "./pricing-cards";

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

type LocalizedPricingPageProps = {
  locale: SupportedLocale;
};

export async function LocalizedPricingPage({ locale }: LocalizedPricingPageProps) {
  const { userId: clerkUserId } = await auth();
  const billing = clerkUserId
    ? await getUserBillingStateByClerkId(clerkUserId)
    : null;
  const currentPlanTier = billing?.planTier ?? "FREE";
  const hasAmbassadorSupport = billing
    ? (await prisma.referralCodeSubmission.count({
        where: { userId: billing.userId },
      })) > 0
    : false;
  const homeCopy = getHomeCopy(locale);
  const pricingCopy = getPricingCopy(locale);
  const homeHref = getLocalizedPath("/", locale);
  const pricingHref = getLocalizedPath("/pricing", locale);
  const billingHref = getLocalizedPath("/billing", locale);
  const blogHref = getLocalizedPath("/blog", locale);

  return (
    <LoadGate
      fallbackClassName={`min-h-screen w-full bg-white ${poppinsClassName}`}
    >
      <main
        className={`relative min-h-screen overflow-hidden bg-white text-black ${poppinsClassName}`}
      >
        <MarketingNavbar
          interClassName={interClassName}
          instrumentSerifClassName={instrumentSerif.className}
          homeHref={homeHref}
          sectionPrefix={homeHref}
          standaloneAction="back"
          pricingHref={pricingHref}
          billingHref={billingHref}
          blogHref={blogHref}
          copy={homeCopy.nav}
          languageSwitcher={
            <MarketingLocaleSwitcher
              locale={locale}
              label={homeCopy.nav.language}
              path="/pricing"
              className={`${interClassName} hero-load-up hero-load-up-nav-cta inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full outline-black outline-2 bg-transparent px-2.5 text-[0.72rem] font-medium tracking-[0.01em] text-black transition-all duration-200 hover:border-[#a01717] hover:text-[#a01717] disabled:cursor-wait disabled:opacity-65 sm:px-3.5 sm:text-[0.76rem]`}
            />
          }
        />

        <PricingCards
          isSignedIn={Boolean(clerkUserId)}
          currentPlanTier={currentPlanTier}
          hasAmbassadorSupport={hasAmbassadorSupport}
          copy={pricingCopy}
        />

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
