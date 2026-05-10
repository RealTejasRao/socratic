import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ContactSection } from "@/src/components/home/contact-section";
import { Footer } from "@/src/components/home/footer";
import { createPageMetadata } from "@/src/lib/seo";
import { ROUTES } from "@/src/lib/routes";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = createPageMetadata({
  title: "Contact Socratic AI | Philosophy AI Team",
  description:
    "Contact Socratic AI for partnerships, feedback, and product questions about our AI for philosophy and strategic reasoning.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <main className="bg-[#fefefc]">
      <ContactSection interClassName={inter.className} />
      <Footer interClassName={inter.className} sectionPrefix={ROUTES.CONTACT} />
    </main>
  );
}
