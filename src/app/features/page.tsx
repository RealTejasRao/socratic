import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { FeaturesSection } from "@/src/components/home/features-section";
import { UseCasesSection } from "@/src/components/home/use-cases-section";
import { SecuritySeparator } from "@/src/components/home/security-separator";
import { Footer } from "@/src/components/home/footer";
import { createPageMetadata } from "@/src/lib/seo";
import { ROUTES } from "@/src/lib/routes";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = createPageMetadata({
  title: "Socratic AI Features | AI for Philosophy and Strategy",
  description:
    "Explore Socratic AI features for philosophy AI conversations, strategy AI debate practice, and intelligent learning assistant workflows.",
  path: "/features",
});

export default function FeaturesPage() {
  return (
    <main className="bg-[#fefefc]">
      <FeaturesSection interClassName={inter.className} />
      <SecuritySeparator interClassName={inter.className} />
      <UseCasesSection interClassName={inter.className} />
      <Footer interClassName={inter.className} sectionPrefix={ROUTES.FEATURES} />
    </main>
  );
}
