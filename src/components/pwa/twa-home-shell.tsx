"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Instrument_Serif, Poppins } from "next/font/google";
import { useEffect } from "react";
import { useStandaloneMode } from "@/src/hooks/use-standalone-mode";
import { ROUTES } from "@/src/lib/routes";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

type TwaHomeShellProps = {
  isSignedIn: boolean;
};

export function TwaHomeShell({ isSignedIn }: TwaHomeShellProps) {
  const router = useRouter();
  const isStandalone = useStandaloneMode();

  useEffect(() => {
    if (isStandalone && isSignedIn) {
      router.replace(ROUTES.APP_ROLEPLAY);
    }
  }, [isSignedIn, isStandalone, router]);

  if (isSignedIn) {
    return <div className="pwa-standalone-only min-h-svh bg-[#1e1d1b]" />;
  }

  return (
    <div className="pwa-standalone-only">
      <main
        className={`relative min-h-svh overflow-hidden bg-[#1e1d1b] text-[#f6efe5] ${poppins.className}`}
      >
        <Image
          src="/twa/intro/first.webp"
          alt="Books and sculpture surrounded by flowers"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-x-0 bottom-0 h-[44%] bg-[linear-gradient(180deg,rgba(8,9,10,0)_0%,rgba(8,9,10,0.18)_35%,rgba(8,9,10,0.62)_100%)]" />
        <section className="relative z-10 flex min-h-svh flex-col justify-between px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-7">
          <div className="max-w-84 pt-1">
            <Image
              src="/brand/Logo_Light_SVG.svg"
              alt="Socratic AI"
              width={44}
              height={44}
              className="mb-5 h-11 w-11"
              priority
            />
            <h1
              className={`${instrumentSerif.className} text-[1.78rem] leading-[1.02] tracking-[0.018em] text-[#fbf4eb] sm:text-[2rem]`}
            >
              Your mind was meant for more
            </h1>
            <p className="mt-4 text-[0.8rem] leading-[1.65] text-white/80 sm:text-[0.8rem]">
              Your secret place for deep thoughts and conversations that change
              you, away from the distractions of the world.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href={ROUTES.SIGN_UP}
              className="inline-flex min-h-15 w-full items-center justify-center rounded-full bg-[#f6f2ea] px-6 text-[1rem] font-medium text-[#122638] shadow-[0_10px_28px_rgba(0,0,0,0.22)] transition-transform duration-200 active:scale-[0.985]"
            >
              Create Account
            </Link>
            <Link
              href={ROUTES.SIGN_IN}
              className="inline-flex min-h-15 w-full items-center justify-center rounded-full border border-white/18 bg-black/14 px-6 text-[1rem] font-medium text-white/94 backdrop-blur-sm transition-colors duration-200 hover:bg-black/20 active:scale-[0.985]"
            >
              Login
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
