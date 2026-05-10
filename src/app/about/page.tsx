import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Instrument_Serif, Inter } from "next/font/google";
import { Footer } from "@/src/components/home/footer";
import { createPageMetadata } from "@/src/lib/seo";
import { ROUTES } from "@/src/lib/routes";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = createPageMetadata({
  title: "About Socratic AI | Philosophy AI Thinking Partner",
  description:
    "Learn how Socratic AI combines philosophy AI, strategy AI, and an intelligent learning assistant into a rigorous AI thinking partner.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#fefefc]">
      <section className="mx-auto w-full max-w-310 px-5 pb-14 pt-14 sm:px-7 sm:pt-18">
        <p
          className={`${inter.className} text-[11px] uppercase tracking-[0.18em] text-black/55`}
        >
          About Socratic AI
        </p>
        <h1
          className={`${instrumentSerif.className} mt-4 max-w-[18ch] text-[clamp(2.3rem,8vw,4rem)] leading-[1.02] text-black/92`}
        >
          AI for philosophy, strategy, and clearer thinking.
        </h1>
        <p className={`${inter.className} mt-5 max-w-[70ch] text-black/70`}>
          Socratic AI is built as a question-first AI thinking partner. Instead
          of shallow agreement loops, it helps you test assumptions, strengthen
          arguments, and produce better reasoning under pressure.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={ROUTES.HOME}
            className={`${inter.className} inline-flex items-center rounded-full border border-black/18 bg-black px-5 py-2 text-[13px] text-white`}
          >
            Get Started
          </Link>
          <Link
            href={ROUTES.FEATURES}
            className={`${inter.className} inline-flex items-center rounded-full border border-black/18 px-5 py-2 text-[13px] text-black/85`}
          >
            Explore Features
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-310 px-5 pb-16 sm:px-7">
        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className="relative min-h-[320px] overflow-hidden rounded-[22px] border border-black/10">
            <Image
              src="/media/About/new_hero.jpg"
              alt="Socratic AI philosophy workspace visual"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 60vw"
              className="object-cover"
            />
          </div>
          <div className="rounded-[22px] border border-black/10 bg-white/75 p-6">
            <h2
              className={`${instrumentSerif.className} text-[1.8rem] leading-[1.05] text-black/90`}
            >
              Built for thought, not noise.
            </h2>
            <p className={`${inter.className} mt-4 text-sm leading-7 text-black/68`}>
              Socratic AI is designed for students, founders, writers, and
              strategists who value precision over speed. It supports deep
              dialogue, philosophical exploration, and structured debate.
            </p>
            <p className={`${inter.className} mt-3 text-sm leading-7 text-black/68`}>
              Every interaction is oriented toward better judgment: clearer
              claims, stronger evidence, and more coherent thinking.
            </p>
          </div>
        </div>
      </section>

      <Footer interClassName={inter.className} sectionPrefix={ROUTES.HOMEPAGE} />
    </main>
  );
}
