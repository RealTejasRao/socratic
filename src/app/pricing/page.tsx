import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { auth } from "@clerk/nextjs/server";
import { Footer } from "@/src/components/home/footer";
import { MarketingNavbar } from "@/src/components/navigation/marketing-navbar";
import { LoadGate } from "@/src/components/ui/load-gate";
import { ROUTES } from "@/src/lib/routes";
import { createPageMetadata } from "@/src/lib/seo";
import { SOCRATIC_PLUS_NAME } from "@/src/lib/billing";
import { getUserBillingStateByClerkId } from "@/src/server/billing/access";
import PricingCards from "./pricing-cards";

export const metadata: Metadata = createPageMetadata({
  title: "Pricing",
  description: `Choose a plan for ${SOCRATIC_PLUS_NAME}.`,
  path: "/pricing",
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

export default async function PricingPage() {
  const { userId: clerkUserId } = await auth();
  const billing = clerkUserId
    ? await getUserBillingStateByClerkId(clerkUserId)
    : null;
  const currentPlanTier = billing?.planTier ?? "FREE";

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
          sectionPrefix={ROUTES.HOME}
          standaloneAction="back"
        />

        <PricingCards
          isSignedIn={Boolean(clerkUserId)}
          currentPlanTier={currentPlanTier}
        />

        <Footer interClassName={interClassName} sectionPrefix={ROUTES.HOME} />
      </main>
    </LoadGate>
  );
}
