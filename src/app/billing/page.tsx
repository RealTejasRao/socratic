import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Instrument_Serif, Inter } from "next/font/google";
import { Footer } from "@/src/components/home/footer";
import { MarketingNavbar } from "@/src/components/navigation/marketing-navbar";
import { LoadGate } from "@/src/components/ui/load-gate";
import { SocraticPlusBillingExperience } from "@/src/components/billing/socratic-plus-billing-experience";
import { ROUTES } from "@/src/lib/routes";
import { createPageMetadata } from "@/src/lib/seo";
import { getUserBillingStateByClerkId } from "@/src/server/billing/access";

export const metadata: Metadata = createPageMetadata({
  title: "Billing",
  description: "Manage your Socratic+ subscription and billing settings.",
  path: "/billing",
});

const poppinsClassName = "[font-family:Poppins,sans-serif]";
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
});

type BillingPageProps = {
  searchParams?:
    | Promise<{
        welcome?: string | string[];
      }>
    | {
        welcome?: string | string[];
      };
};

function getFirstParamValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
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
          sectionPrefix={ROUTES.HOME}
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
        />

        <Footer interClassName={inter.className} sectionPrefix={ROUTES.HOME} />
      </main>
    </LoadGate>
  );
}
