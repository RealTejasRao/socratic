import Image from "next/image";
import Link from "next/link";
import { GradientBackground } from "@/src/components/ui/paper-design-shader-background";
import { Instrument_Serif } from "next/font/google";
import CurvedLoop from "@/src/components/ui/curved-loop";
import EarlyAccessForm from "@/src/components/home/early-access-form";
import { ROUTES } from "@/src/lib/routes";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
});

export default function HomePage() {
  return (
    <main className="relative flex h-full min-h-screen w-full items-center justify-center overflow-hidden">
      <GradientBackground />
      <div className="hero-fade absolute inset-0 -z-10 bg-black/25" />

      <div className="ui-chip-anim absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
        <div className="group relative">
          <div className="flex items-center gap-2.5 rounded-full border border-white/30 bg-black/35 px-4 py-2 backdrop-blur-md">
            <Image
              src="/brand/Logo_Dark_SVG.svg"
              alt="Socratic AI logo"
              width={26}
              height={26}
              className="h-6.5 w-6.5 object-contain invert"
            />
            <span
              className={`${instrumentSerif.className} text-lg leading-none tracking-wide text-white/92`}
            >
              Socratic AI
            </span>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-6 top-full z-10 mt-1 h-1.5 w-1.5 rotate-45 rounded-[2px] border-l border-t border-white/45 bg-[#1e2430]/90 opacity-0 transition duration-200 group-hover:opacity-100 sm:left-1/2 sm:-translate-x-1/2"
          />
          <div className="pointer-events-none absolute left-0 top-full z-10 mt-2 max-w-40 rounded-lg border border-white/20 bg-[#1e2430]/90 px-2.5 py-1 text-[10px] leading-tight text-white opacity-0 shadow-[0_10px_24px_rgba(15,23,42,0.35)] backdrop-blur-sm transition duration-200 group-hover:opacity-100 sm:left-1/2 sm:max-w-none sm:-translate-x-1/2 sm:text-[11px] sm:whitespace-nowrap">
            Your Personal AI for Philosophy
          </div>
        </div>
      </div>

      <div className="ui-chip-anim absolute right-4 top-4 z-20 [animation-delay:80ms] sm:right-6 sm:top-6">
        <div className="flex w-[7.75rem] flex-col gap-2">
          <div className="flex items-center justify-between">
            <a
              href="https://x.com/useSocraticAI"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="X"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white/90 backdrop-blur-md transition hover:bg-black/55"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 fill-current"
                aria-hidden="true"
              >
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.847h-7.406l-5.8-7.584-6.639 7.584H.474l8.599-9.83L0 1.154h7.594l5.243 6.932zM17.61 20.644h2.039L6.486 3.24H4.298z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/company/usesocratic/"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="LinkedIn"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white/90 backdrop-blur-md transition hover:bg-black/55"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 fill-current"
                aria-hidden="true"
              >
                <path d="M20.447 20.452H16.89v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.94v5.666H9.35V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.369-1.85 3.601 0 4.266 2.37 4.266 5.455zM5.337 7.433a2.063 2.063 0 11.004-4.126 2.063 2.063 0 01-.004 4.126zM7.119 20.452H3.555V9h3.564z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/usesocratic/"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white/90 backdrop-blur-md transition hover:bg-black/55"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 fill-current"
                aria-hidden="true"
              >
                <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 1.8A3.95 3.95 0 003.8 7.75v8.5a3.95 3.95 0 003.95 3.95h8.5a3.95 3.95 0 003.95-3.95v-8.5a3.95 3.95 0 00-3.95-3.95zm8.925 1.35a1.125 1.125 0 110 2.25 1.125 1.125 0 010-2.25zM12 7a5 5 0 110 10 5 5 0 010-10zm0 1.8a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4z" />
              </svg>
            </a>
          </div>
          <Link
            href={ROUTES.HOMEPAGE}
            className="inline-flex h-9 w-full items-center justify-center rounded-full border border-white/30 bg-black/35 text-sm text-white/92 backdrop-blur-md transition hover:bg-black/55"
          >
            About
          </Link>
        </div>
      </div>

      <section className="px-4 sm:px-6">
        <div className="hero-card-anim relative mx-auto w-full max-w-[20rem] translate-y-15 overflow-hidden rounded-[1.55rem] border border-white/25 bg-linear-to-br from-black/55 via-black/40 to-black/30 p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-3xl sm:max-w-sm sm:translate-y-16 sm:rounded-[1.7rem] sm:p-7">
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-400/22 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-fuchsia-400/18 blur-2xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-linear-to-b from-white/16 to-transparent" />

          <h2
            className={`${instrumentSerif.className} relative text-center text-[2rem] tracking-tight text-white sm:text-[2.55rem]`}
          >
            Get Priority Access
          </h2>
          <p className="relative mt-2 text-center text-[0.92rem] leading-relaxed text-slate-200/88 sm:mt-2.5 sm:text-sm">
            Socratic AI is launching soon. We are planning to give early access
            to a limited number of people. Reserve your spot now!
          </p>

          <EarlyAccessForm />
        </div>

        <div className="hero-loop-anim relative left-1/2 mt-10 mb-4 w-screen max-w-none -translate-x-1/2 overflow-hidden sm:mt-0 sm:mb-4">
          <CurvedLoop
            marqueeText="Philosophy ✦ Meets ✦ AI ✦ Meets ✦"
            speed={0.5}
            curveAmount={200}
            direction="left"
            interactive={false}
            className={`${instrumentSerif.className} fill-white/90 tracking-[0.04em] text-[3rem] sm:text-xl`}
          />
        </div>
      </section>
    </main>
  );
}
