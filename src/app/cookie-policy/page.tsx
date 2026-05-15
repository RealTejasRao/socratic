import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { createPageMetadata } from "@/src/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Cookie Policy",
  description:
    "Read Socratic AI's Cookie Policy to understand what cookies we use, why we use them, and how you can manage your preferences.",
  path: "/cookie-policy",
});

async function getCookiePolicyHtml() {
  const policyPath = path.join(
    process.cwd(),
    "public",
    "instruction",
    "instruction.txt",
  );
  return fs.readFile(policyPath, "utf8");
}

export default async function CookiePolicyPage() {
  const cookiePolicyHtml = await getCookiePolicyHtml();

  return (
    <main className="min-h-screen bg-[#fefefc] px-5 py-14 sm:px-7 sm:py-18">
      <section className="mx-auto w-full max-w-4xl rounded-lg border border-black/8 bg-white p-5 shadow-sm sm:p-8">
        <div
          className="text-black/80"
          dangerouslySetInnerHTML={{ __html: cookiePolicyHtml }}
        />
      </section>
    </main>
  );
}
