import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Instrument_Serif, Inter } from "next/font/google";
import { ROUTES } from "@/src/lib/routes";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
});

export default function NotFound() {
  return (
    <main className="relative flex h-dvh flex-col overflow-hidden bg-[#fefefe] text-[#0d1b3d]">
      <header className="relative z-20 px-6 pt-5 sm:px-10 sm:pt-8">
        <Link
          href={ROUTES.HOME}
          className="inline-flex items-center gap-3 text-black/86 transition-opacity hover:opacity-90"
        >
          <Image
            src="/brand/Logo_Dark_SVG.svg"
            alt="Socratic AI logo"
            width={44}
            height={44}
            className="h-11 w-11 object-contain"
            priority
          />
          <span
            className={`${instrumentSerif.className} text-[clamp(1.45rem,2.15vw,2.1rem)]`}
          >
            Socratic AI
          </span>
        </Link>
      </header>

      <section className="relative z-10 mx-auto grid h-full max-h-full w-full max-w-[118rem] flex-1 items-center gap-6 overflow-hidden px-6 pt-2 sm:px-10 lg:grid-cols-[minmax(20rem,34rem)_1fr] lg:gap-1">
        <div className="mx-auto w-full max-w-[36rem] text-center lg:mx-0 lg:translate-x-14 lg:text-left xl:translate-x-20">
          <p
            className={`${instrumentSerif.className} text-[clamp(4.8rem,10vw,11.4rem)] leading-[0.84] tracking-[-0.03em] text-[#A01717]`}
          >
            404
          </p>
          <h1
            className={`${instrumentSerif.className} mt-4 text-[clamp(1.8rem,2.7vw,3rem)] leading-[1.06] text-black/90`}
          >
            Page Not Found
          </h1>

          <p
            className={`${inter.className} mx-auto mt-6 max-w-[34ch] text-[clamp(0.95rem,1.02vw,1.12rem)] leading-7 text-[#424a5e] lg:mx-0`}
          >
            The page you are looking for might have been removed, had its name
            changed, or is temporarily unavailable.
          </p>

          <Link
            href={ROUTES.HOME}
            className={`${inter.className} group outline outline-[#A01717] mt-10 inline-flex h-9 items-center gap-2 rounded-full border border-black/55 bg-white px-5 text-[0.75rem] tracking-[0.02em] text-black/85 transition-colors duration-200 hover:bg-[#A01717] hover:text-white`}
          >
            <span>Return Home</span>
            <ArrowRight
              aria-hidden="true"
              className="hero-cta-arrow-loop h-3.5 w-3.5 stroke-[2.6]"
            />
          </Link>
        </div>

        <div className="relative h-full min-h-0 w-full self-end">
          <Image
            src="/404/image.png"
            alt="Socrates illustration looking puzzled while holding a phone"
            fill
            sizes="(max-width: 1024px) 98vw, 66rem"
            className="origin-bottom scale-[1.16] object-contain object-bottom lg:scale-[1.34]"
            priority
          />
        </div>
      </section>
    </main>
  );
}
