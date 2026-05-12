import type { Metadata } from "next";
import Image from "next/image";
import { Instrument_Serif, Inter } from "next/font/google";
import { LoadGate } from "@/src/components/ui/load-gate";
import { FeaturesSection } from "@/src/components/home/features-section";
import { HomeHashScroll } from "@/src/components/home/home-hash-scroll";
import { SecuritySeparator } from "@/src/components/home/security-separator";
import { UseCasesSection } from "@/src/components/home/use-cases-section";
import { ContactSection } from "@/src/components/home/contact-section";
import { Footer } from "@/src/components/home/footer";
import { HeroRotatingWord } from "@/src/components/home/hero-rotating-word";
import { StaggeredMenu } from "@/src/components/home/staggered-menu";
import EarlyAccessForm from "@/src/components/home/early-access-form";
import {
  resolveCloudinaryPublicAsset,
  resolveOptimizedCloudinaryPublicAsset,
} from "@/src/lib/cloudinary-public-assets";
import { ROUTES } from "@/src/lib/routes";
import { createPageMetadata } from "@/src/lib/seo";
import { HOME_HERO_HASH, HOME_HERO_ID } from "@/src/lib/home-hero";

export const metadata: Metadata = createPageMetadata({
  title: "Socratic AI Homepage | AI for Philosophy, Strategy, and Deep Thinking",
  description:
    "Explore Socratic AI: an AI for philosophy and strategy built as an AI thinking partner and intelligent learning assistant for rigorous conversation.",
  path: "/",
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

const navLinks = [
  { label: "Home", href: "#" },
  { label: "Features", href: "#features" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Blog", href: ROUTES.BLOG },
  { label: "Contact", href: "#contact" },
];

export default function HomePage() {
  return (
    <LoadGate
      fallbackClassName={`min-h-screen w-full bg-[#fefefc] ${poppinsClassName}`}
    >
      <main
        id="home"
        className={`relative min-h-screen overflow-hidden bg-[#fefefc] ${poppinsClassName}`}
      >
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(160,23,23,0.12)_1px,transparent_1.5px)] bg-size-[22px_22px]" />
        </div>
        <HomeHashScroll />
        <header className="fixed inset-x-0 top-0 z-50 flex flex-col border-b border-black/6 bg-white/60 px-5 py-0 backdrop-blur-md supports-backdrop-filter:bg-white/50 sm:px-7 sm:pt-1.5 sm:pb-0">
          <nav className="relative mx-auto flex h-16 w-full max-w-365 items-center justify-between sm:h-auto">
            <a
              href="#"
              className="hero-load-up hero-load-up-nav-logo group relative flex h-11 w-fit cursor-pointer items-center sm:h-8.5"
            >
              <div className="shrink-0 overflow-hidden">
                <Image
                  src={resolveCloudinaryPublicAsset("/brand/Logo_Dark_SVG.svg")}
                  alt="Socratic AI logo"
                  width={50}
                  height={50}
                  className="h-12 w-12 cursor-pointer object-contain transition duration-500 ease-out group-hover:-translate-y-0.5 group-hover:scale-[1.02] sm:h-10 sm:w-10"
                  priority
                />
              </div>

              <div className="pointer-events-none absolute left-13 top-1/2 flex -translate-y-1/2 items-center overflow-hidden">
                <span className="mr-3 h-4 w-px shrink-0 origin-center scale-y-0 bg-black/22 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100 group-hover:opacity-100" />
                <span
                  className={`${instrumentSerif.className} -translate-x-4.5 whitespace-nowrap text-[1.15rem] font-normal tracking-[0.01em] text-black/78 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0 group-hover:opacity-100`}
                >
                  Socratic AI
                </span>
              </div>
            </a>

            <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
              <div className="pointer-events-auto flex items-center justify-center gap-8">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className={`${interClassName} cursor-pointer text-[0.8rem] font-normal text-black/60 transition-colors duration-200 hover:text-black`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <a
                href={HOME_HERO_HASH}
                className={`${interClassName} hero-load-up hero-load-up-nav-cta inline-flex h-9 min-w-24 items-center justify-center rounded-full border border-black/18 bg-black px-5 text-[0.82rem] font-medium tracking-[0.02em] text-white transition-all duration-250 hover:-translate-y-0.5 hover:bg-black/92 sm:h-7.5 sm:min-w-22 sm:px-4.5 sm:text-[0.76rem]`}
              >
                Try Socratic AI
              </a>

              <StaggeredMenu
                className="hero-load-up hero-load-up-nav-menu lg:hidden"
                triggerVariant="hamburger"
                items={navLinks.map((link) => ({
                  label: link.label,
                  link: link.href,
                  ariaLabel: `Go to ${link.label}`,
                }))}
              />
            </div>
          </nav>

          <div className="mx-auto mt-1.5 w-full max-w-365">
            <div className="h-px w-full bg-[radial-gradient(circle,rgba(120,120,120,0.45)_1px,transparent_1.2px)] bg-position-[left_center] bg-size-[10px_1px] bg-repeat-x" />
          </div>
        </header>

        <section id={HOME_HERO_ID} className="relative h-screen w-full">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-5 pt-24 text-center sm:px-7 sm:pt-[4.6rem]">
            <div
              className={`${instrumentSerif.className} pointer-events-auto flex flex-col items-center text-black/90`}
            >
              <h1 className="hero-load-up hero-load-up-title-1 leading-[1.03] sm:leading-[0.96] sm:text-[clamp(1.45rem,4vw,2.35rem)]">
                <span className="block text-[clamp(1.95rem,7.6vw,2.7rem)] sm:inline sm:text-inherit [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:block [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:text-[clamp(1.95rem,7.6vw,2.7rem)]">
                  Your Personal AI For
                </span>{" "}
                <span className="mt-2.5 block text-[clamp(2.95rem,11.2vw,4.2rem)] sm:hidden [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:block">
                  <HeroRotatingWord align="center" />
                </span>
                <span className="hidden sm:inline [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:hidden">
                  <HeroRotatingWord />
                </span>
              </h1>
              <div className="hero-load-up hero-load-up-hero-cta mt-3.5 w-full px-1 sm:mt-2.5 sm:px-4">
                <EarlyAccessForm variant="inlineHero" theme="light" />
              </div>
              <p
                className={`${interClassName} hero-load-up hero-load-up-hero-copy mt-2.5 max-w-2xl text-center text-[0.74rem] leading-relaxed text-black/45 sm:text-[0.78rem]`}
              >
                Socratic AI is in private beta. Early access is currently being
                granted to limited founding members at no cost. Reserve your
                spot now!
              </p>
            </div>
          </div>

          <div className="hero-bottom-image-scroll pointer-events-none absolute inset-x-0 bottom-0 z-0">
            <div className="hero-load-up hero-load-up-image w-full">
              <Image
                src={resolveOptimizedCloudinaryPublicAsset(
                  "/home/hero_m_final.webp",
                  {
                    width: 1400,
                    crop: "limit",
                    quality: "auto:good",
                  },
                )}
                alt="Socratic AI hero illustration for philosophy and strategic thinking"
                width={1400}
                height={1400}
                sizes="100vw"
                className="home-hero-mobile-image block h-auto w-full object-contain object-bottom sm:hidden [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:block"
                preload
              />
              <Image
                src={resolveOptimizedCloudinaryPublicAsset("/home/hero.webp", {
                  width: 2400,
                  crop: "limit",
                  quality: "auto:good",
                })}
                alt="Socratic AI hero illustration for philosophy and strategic thinking"
                width={2400}
                height={1200}
                sizes="100vw"
                className="hidden h-auto w-full object-contain object-bottom sm:block [@media(orientation:portrait)_and_(min-width:640px)_and_(max-width:1023px)]:hidden"
                preload
              />
            </div>
          </div>
        </section>

        <FeaturesSection interClassName={interClassName} />
        <SecuritySeparator interClassName={interClassName} />
        <UseCasesSection interClassName={interClassName} />
        <ContactSection interClassName={interClassName} />
        <Footer interClassName={interClassName} />
      </main>
    </LoadGate>
  );
}
