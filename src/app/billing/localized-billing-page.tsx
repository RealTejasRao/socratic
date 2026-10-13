import { auth } from "@clerk/nextjs/server";
import { Instrument_Serif, Inter } from "next/font/google";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { SocraticPlusBillingExperience } from "@/src/components/billing/socratic-plus-billing-experience";
import { Footer } from "@/src/components/home/footer";
import { MarketingLocaleSwitcher } from "@/src/components/navigation/marketing-locale-switcher";
import { MarketingNavbar } from "@/src/components/navigation/marketing-navbar";
import { LoadGate } from "@/src/components/ui/load-gate";
import { getBillingCopy } from "@/src/i18n/billing";
import { getHomeCopy } from "@/src/i18n/home";
import { getLocalizedPath, type SupportedLocale } from "@/src/i18n/locales";
import { ROUTES } from "@/src/lib/routes";
import { getUserBillingStateByClerkId } from "@/src/server/billing/access";

const poppinsClassName = "[font-family:Poppins,sans-serif]";
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
});

export type BillingPageSearchParams =
  | Promise<{
      welcome?: string | string[];
    }>
  | {
      welcome?: string | string[];
    };

type LocalizedBillingPageProps = {
  locale: SupportedLocale;
  searchParams?: BillingPageSearchParams | undefined;
};

function getFirstParamValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function LocalizedBillingPage({
  locale,
  searchParams,
}: LocalizedBillingPageProps) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect(ROUTES.SIGN_IN);
  }

  const billing = await getUserBillingStateByClerkId(clerkUserId);

  if (!billing) {
    redirect(ROUTES.HOME);
  }

  const resolvedSearchParams =
    searchParams && "then" in searchParams ? await searchParams : searchParams;
  const welcomeRequested =
    getFirstParamValue(resolvedSearchParams?.welcome) === "1";
  const homeCopy = getHomeCopy(locale);
  const billingCopy = getBillingCopy(locale);
  const homeHref = getLocalizedPath("/", locale);
  const pricingHref: Route = getLocalizedPath("/pricing", locale);
  const billingHref: Route = getLocalizedPath("/billing", locale);
  const blogHref: Route = getLocalizedPath("/blog", locale);

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
          interClassName={inter.className}
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
              path="/billing"
              className={`${inter.className} hero-load-up hero-load-up-nav-cta inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full outline-black outline-2 bg-transparent px-2.5 text-[0.72rem] font-medium tracking-[0.01em] text-black transition-all duration-200 hover:border-[#a01717] hover:text-[#a01717] disabled:cursor-wait disabled:opacity-65 sm:px-3.5 sm:text-[0.76rem]`}
            />
          }
        />

        <SocraticPlusBillingExperience
          interClassName={inter.className}
          instrumentSerifClassName={instrumentSerif.className}
          isPremium={billing.isPremium}
          planTier={billing.planTier}
          planStatus={billing.planStatus}
          subscriptionCurrentPeriodEndIso={
            billing.subscriptionCurrentPeriodEnd
              ? billing.subscriptionCurrentPeriodEnd.toISOString()
              : null
          }
          subscriptionCancelAtPeriodEnd={billing.subscriptionCancelAtPeriodEnd}
          welcomeRequested={welcomeRequested}
          locale={locale}
          copy={billingCopy}
          pricingHref={pricingHref}
        />

        <Footer
          interClassName={inter.className}
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
