"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Instrument_Serif, Poppins } from "next/font/google";
import CurvedLoop from "@/src/components/ui/curved-loop";
import { GradientBackground } from "@/src/components/ui/paper-design-shader-background";
import EarlyAccessForm from "@/src/components/home/early-access-form";
import { ROUTES } from "@/src/lib/routes";

type ThemeMode = "dark" | "light";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: "500",
});

export default function EarlyAccessPage() {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  const isLight = theme === "light";

  const chipShellClassName = isLight
    ? "flex items-center gap-2.5 rounded-full border border-slate-300/85 bg-white/72 px-4 py-2 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-white/92 hover:shadow-[0_8px_20px_rgba(148,163,184,0.22)]"
    : "flex items-center gap-2.5 rounded-full border border-white/30 bg-black/35 px-4 py-2 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-black/55 hover:shadow-[0_10px_24px_rgba(0,0,0,0.34)]";

  const chipTextClassName = isLight
    ? `${instrumentSerif.className} text-lg leading-none tracking-wide text-slate-900 transition-colors duration-300 ease-out`
    : `${instrumentSerif.className} text-lg leading-none tracking-wide text-white/92 transition-colors duration-300 ease-out`;

  const tooltipPointerClassName = isLight
    ? "pointer-events-none absolute left-6 top-full z-10 mt-1 h-1.5 w-1.5 rotate-45 rounded-[2px] border-l border-t border-slate-300/80 bg-white/95 opacity-0 transition-all duration-250 ease-out group-hover:translate-y-0.5 group-hover:opacity-100 sm:left-1/2 sm:-translate-x-1/2"
    : "pointer-events-none absolute left-6 top-full z-10 mt-1 h-1.5 w-1.5 rotate-45 rounded-[2px] border-l border-t border-white/45 bg-[#1e2430]/90 opacity-0 transition-all duration-250 ease-out group-hover:translate-y-0.5 group-hover:opacity-100 sm:left-1/2 sm:-translate-x-1/2";

  const tooltipCardClassName = isLight
    ? "pointer-events-none absolute left-0 top-full z-10 mt-2 max-w-40 rounded-lg border border-slate-300/80 bg-white/95 px-2.5 py-1 text-[10px] leading-tight text-slate-700 opacity-0 shadow-[0_10px_24px_rgba(148,163,184,0.3)] backdrop-blur-sm transition-all duration-250 ease-out group-hover:translate-y-0.5 group-hover:opacity-100 sm:left-1/2 sm:max-w-none sm:-translate-x-1/2 sm:text-[11px] sm:whitespace-nowrap"
    : "pointer-events-none absolute left-0 top-full z-10 mt-2 max-w-40 rounded-lg border border-white/20 bg-[#1e2430]/90 px-2.5 py-1 text-[10px] leading-tight text-white opacity-0 shadow-[0_10px_24px_rgba(15,23,42,0.35)] backdrop-blur-sm transition-all duration-250 ease-out group-hover:translate-y-0.5 group-hover:opacity-100 sm:left-1/2 sm:max-w-none sm:-translate-x-1/2 sm:text-[11px] sm:whitespace-nowrap";

  const socialButtonClassName = isLight
    ? "flex h-9 w-9 items-center justify-center rounded-full border border-slate-300/85 bg-white/72 text-slate-800 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-white/95 hover:shadow-[0_10px_24px_rgba(148,163,184,0.24)]"
    : "flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white/90 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-black/55 hover:shadow-[0_10px_24px_rgba(0,0,0,0.35)]";

  const aboutLinkClassName = isLight
    ? `${poppins.className} h-9 items-center justify-center rounded-full outline outline-black bg-transparent text-sm font-medium text-black transition-all duration-300 ease-out hover:-translate-y-0.5`
    : `${poppins.className} h-9 items-center justify-center rounded-full outline outline-white bg-transparent text-sm font-medium text-white transition-all duration-300 ease-out hover:-translate-y-0.5`;

  const toggleButtonClassName = isLight
    ? "relative h-9 w-9 items-center justify-center rounded-full cursor-pointer bg-transparent text-black transition-all duration-350 ease-out hover:-translate-y-0.5"
    : "relative h-9 w-9 items-center justify-center rounded-full cursor-pointer bg-transparent text-white transition-all duration-350 ease-out hover:-translate-y-0.5";

  const heroCardClassName = isLight
    ? "hero-card-anim relative mx-auto w-full max-w-[20rem] translate-y-15 overflow-hidden rounded-[1.55rem] border border-white/60 bg-linear-to-br from-white/42 via-[#fffaf3]/32 to-[#fff1f6]/28 p-5 text-slate-950 shadow-[0_24px_70px_rgba(148,163,184,0.28),inset_0_1px_0_rgba(255,255,255,0.78),inset_0_-1px_0_rgba(255,255,255,0.22)] backdrop-blur-[16px] transition-[background-color,border-color,box-shadow,color] duration-500 ease-out sm:max-w-sm sm:translate-y-16 sm:rounded-[1.7rem] sm:p-7"
    : "hero-card-anim relative mx-auto w-full max-w-[20rem] translate-y-15 overflow-hidden rounded-[1.55rem] border border-white/25 bg-linear-to-br from-black/55 via-black/40 to-black/30 p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-3xl transition-[background-color,border-color,box-shadow,color] duration-500 ease-out sm:max-w-sm sm:translate-y-16 sm:rounded-[1.7rem] sm:p-7";

  const cardGlowTopClassName = isLight
    ? "pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-300/30 blur-2xl transition-all duration-500 ease-out"
    : "pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-400/22 blur-2xl transition-all duration-500 ease-out";

  const cardGlowBottomClassName = isLight
    ? "pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-fuchsia-300/26 blur-2xl transition-all duration-500 ease-out"
    : "pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-fuchsia-400/18 blur-2xl transition-all duration-500 ease-out";

  const cardHighlightClassName = isLight
    ? "pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-white/72 via-white/24 to-transparent transition-all duration-500 ease-out"
    : "pointer-events-none absolute inset-x-0 top-0 h-14 bg-linear-to-b from-white/16 to-transparent transition-all duration-500 ease-out";

  const heroTitleClassName = isLight
    ? `${instrumentSerif.className} relative text-center text-[2rem] tracking-tight text-slate-950 transition-colors duration-500 ease-out sm:text-[2.55rem]`
    : `${instrumentSerif.className} relative text-center text-[2rem] tracking-tight text-white transition-colors duration-500 ease-out sm:text-[2.55rem]`;

  const heroCopyClassName = isLight
    ? "relative mt-2 text-center text-[0.92rem] leading-relaxed text-slate-700/92 transition-colors duration-500 ease-out sm:mt-2.5 sm:text-sm"
    : "relative mt-2 text-center text-[0.92rem] leading-relaxed text-slate-200/88 transition-colors duration-500 ease-out sm:mt-2.5 sm:text-sm";

  const loopClassName = isLight
    ? `${instrumentSerif.className} fill-slate-900/90 tracking-[0.04em] text-[3rem] transition-colors duration-500 ease-out sm:text-xl`
    : `${instrumentSerif.className} fill-white/90 tracking-[0.04em] text-[3rem] transition-colors duration-500 ease-out sm:text-xl`;

  const ThemeToggleButton = ({ className = "" }: { className?: string }) => (
    <button
      type="button"
      onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
      className={`${toggleButtonClassName} ${className}`.trim()}
    >
      <span
        className={`absolute inset-0 flex items-center justify-center transition-all duration-350 ease-out ${isLight ? "rotate-45 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100"}`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4.5 w-4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6M18.8 18.8l-1.6-1.6M6.8 6.8L5.2 5.2" />
        </svg>
      </span>
      <span
        className={`absolute inset-0 flex items-center justify-center transition-all duration-350 ease-out ${isLight ? "rotate-0 scale-100 opacity-100" : "-rotate-45 scale-75 opacity-0"}`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4.5 w-4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
        </svg>
      </span>
    </button>
  );

  return (
    <main className="relative flex h-full min-h-screen w-full items-center justify-center overflow-hidden transition-colors duration-500 ease-out">
      <GradientBackground theme={theme} />
      <div
        className={`hero-fade absolute inset-0 -z-10 transition-colors duration-500 ease-out ${isLight ? "bg-white/28" : "bg-black/25"}`}
      />

      <div className="ui-chip-anim absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <div className="group relative">
            <div className={chipShellClassName}>
              <Image
                src="/brand/Logo_Dark_SVG.svg"
                alt="Socratic AI logo"
                width={26}
                height={26}
                className={`h-6.5 w-6.5 object-contain ${isLight ? "" : "invert"}`}
              />
              <span className={chipTextClassName}>Socratic AI</span>
            </div>
            <div aria-hidden="true" className={tooltipPointerClassName} />
            <div className={tooltipCardClassName}>
              Your Personal AI for Philosophy
            </div>
          </div>
          <Link
            href={ROUTES.HOME}
            className={`${aboutLinkClassName} flex w-28 sm:hidden`}
          >
            About
          </Link>
          <ThemeToggleButton className="hidden sm:inline-flex" />
        </div>
      </div>

      <div className="ui-chip-anim absolute right-4 top-4 z-20 [animation-delay:80ms] sm:right-6 sm:top-6">
        <div className="flex w-31 flex-col gap-2">
          <div className="flex items-center justify-between">
            <a
              href="https://x.com/useSocraticAI"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="X"
              className={socialButtonClassName}
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
              className={socialButtonClassName}
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
              className={socialButtonClassName}
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
          <div className="flex justify-end sm:hidden">
            <ThemeToggleButton className="inline-flex" />
          </div>
          <Link
            href={ROUTES.HOME}
            className={`${aboutLinkClassName} hidden w-full sm:flex`}
          >
            About
          </Link>
        </div>
      </div>

      <section className="px-4 sm:px-6">
        <div className="relative">
          <div className={heroCardClassName}>
            <div className={cardGlowTopClassName} />
            <div className={cardGlowBottomClassName} />
            <div className={cardHighlightClassName} />

            <h1 className={heroTitleClassName}>Try Socratic AI Now</h1>
            <p className={heroCopyClassName}>
              Socratic AI is live. Sign in and start thinking, debating, and
              exploring ideas right now.
            </p>

            <EarlyAccessForm theme={theme} />
          </div>
        </div>

        <div className="hero-loop-anim relative left-1/2 mt-10 mb-4 w-screen max-w-none -translate-x-1/2 overflow-hidden sm:mt-0 sm:mb-4">
          <CurvedLoop
            marqueeText="Philosophy ✦ Meets ✦ AI ✦ Meets ✦"
            speed={0.5}
            curveAmount={200}
            direction="left"
            interactive={false}
            className={loopClassName}
          />
        </div>
      </section>
    </main>
  );
}
