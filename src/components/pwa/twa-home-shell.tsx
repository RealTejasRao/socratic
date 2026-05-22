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
      router.replace(ROUTES.APP);
    }
  }, [isSignedIn, isStandalone, router]);

  if (isSignedIn) {
    return <div className="pwa-standalone-only min-h-svh bg-[#1e1d1b]" />;
  }

  return (
    <div className="pwa-standalone-only">
      <main
        className={`min-h-svh bg-[#1e1d1b] px-4 py-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))] text-[#f6efe5] ${poppins.className}`}
      >
        <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-[30rem] flex-col items-start justify-center">
          <p
            className={`${instrumentSerif.className} mb-4 text-[2.15rem] leading-none tracking-[-0.04em] text-[#fbf4eb]`}
          >
            Get started
          </p>
          <section className="intro-shell-card relative w-full overflow-hidden rounded-[2rem] border border-white/8 bg-[#12110f] shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
            <div className="relative aspect-[7/12] min-h-[38rem] w-full sm:min-h-[46rem]">
              <Image
                src="/twa/intro/sign.webp"
                alt="Books and sculpture surrounded by flowers"
                fill
                priority
                sizes="(max-width: 640px) 100vw, 30rem"
                className="object-cover object-center"
              />
              <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(180deg,rgba(8,9,10,0)_0%,rgba(8,9,10,0.16)_38%,rgba(8,9,10,0.5)_100%)]" />

              <div className="relative flex h-full flex-col justify-between p-6 sm:p-7">
                <div className="max-w-[15rem] sm:max-w-[18rem]">
                  <h1
                    className={`${instrumentSerif.className} text-[2.15rem] leading-[0.92] tracking-[-0.04em] text-[#fbf4eb] sm:text-[2.55rem]`}
                  >
                    Your mind was meant for more
                  </h1>
                  <p className="mt-4 max-w-[16.5rem] text-[0.96rem] leading-[1.65] text-white/80 sm:max-w-[18rem] sm:text-[1rem]">
                    Your secret place for deep thought and conversations that
                    change you, away from the distractions of the world.
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
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
