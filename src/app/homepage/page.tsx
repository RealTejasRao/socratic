import Image from "next/image";
import Link from "next/link";
import { Instrument_Serif } from "next/font/google";
import { LoadGate } from "@/src/components/ui/load-gate";
import { FeaturesSection } from "@/src/components/home/features-section";
import { HomeHashScroll } from "@/src/components/home/home-hash-scroll";
import { SecuritySeparator } from "@/src/components/home/security-separator";
import { UseCasesSection } from "@/src/components/home/use-cases-section";
import { ContactSection } from "@/src/components/home/contact-section";
import { Footer } from "@/src/components/home/footer";
import { StaggeredMenu } from "@/src/components/home/staggered-menu";
import { resolveCloudinaryPublicAsset } from "@/src/lib/cloudinary-public-assets";
import { ROUTES } from "@/src/lib/routes";

const poppinsClassName = "[font-family:Poppins,sans-serif]";
const interClassName = "[font-family:Inter,sans-serif]";
const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
});

const navLinks = [
  { label: "Home", href: "#" },
  { label: "Features", href: "#features" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "About", href: ROUTES.ABOUT },
  { label: "Contact", href: "#contact" },
];

export default function HomePage() {
  return (
    <LoadGate
      fallbackClassName={`min-h-screen w-full bg-[#fefefc] ${poppinsClassName}`}
    >
      <main
        className={`relative min-h-screen overflow-hidden bg-[#fefefc] ${poppinsClassName}`}
      >
        <HomeHashScroll />
        <header className="fixed inset-x-0 top-0 z-50 bg-transparent px-6 pt-2.5 sm:px-8 sm:pt-2">
          <nav className="relative mx-auto flex w-full max-w-365 items-center justify-between">
            <a
              href="#"
              className="hero-load-up hero-load-up-nav-logo group relative flex h-9.5 w-fit cursor-pointer items-center"
            >
              <div className="shrink-0 overflow-hidden">
                <Image
                  src={resolveCloudinaryPublicAsset("/brand/Logo_Dark_SVG.svg")}
                  alt="Socratic AI logo"
                  width={50}
                  height={50}
                  className="h-11.25 w-11.25 cursor-pointer object-contain transition duration-500 ease-out group-hover:-translate-y-0.5 group-hover:scale-[1.02]"
                  priority
                />
              </div>

              <div className="pointer-events-none absolute left-13 top-1/2 flex -translate-y-1/2 items-center overflow-hidden">
                <span className="mr-3 h-4 w-px shrink-0 origin-center scale-y-0 bg-black/22 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100 group-hover:opacity-100" />
                <span className="-translate-x-4.5 whitespace-nowrap text-[0.82rem] font-normal tracking-[0.01em] text-black/78 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0 group-hover:opacity-100">
                  Socratic AI
                </span>
              </div>
            </a>

            <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
              <div className="pointer-events-auto flex items-center justify-center gap-10">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="cursor-pointer text-[0.88rem] font-normal text-black/60 transition-colors duration-200 hover:text-black"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Link
                href={ROUTES.SIGN_UP}
                className="hero-load-up hero-load-up-nav-cta inline-flex outline-[1.3px] outline-black h-8 min-w-29 items-center justify-center rounded-full bg-white/92 px-10 text-[0.82rem] font-medium tracking-[0.02em] text-black/80 backdrop-blur-md transition-all duration-250 hover:-translate-y-0.5 hover:bg-[#A01717] hover:text-white"
              >
                Get started
              </Link>

              <StaggeredMenu
                className="hero-load-up hero-load-up-nav-menu lg:hidden"
                items={navLinks.map((link) => ({
                  label: link.label,
                  link: link.href,
                  ariaLabel: `Go to ${link.label}`,
                }))}
              />
            </div>
          </nav>
        </header>

        <section className="relative h-screen w-full">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-6 pt-[8vh] text-center sm:pt-[20vh]">
            <div
              className={`${instrumentSerif.className} pointer-events-auto flex flex-col items-center text-black/90`}
            >
              <p className="hero-load-up hero-load-up-title-1 text-[clamp(1.8rem,5vw,3rem)] leading-[0.95]">
                Your Personal AI For{" "}
                <span className="italic text-[#A01717]">Philosophy</span>
              </p>
              <Link
                href={ROUTES.SIGN_UP}
                className={`${poppinsClassName} hero-load-up hero-load-up-hero-cta mt-9 inline-flex h-9 items-center rounded-full border border-black/55 bg-white px-5 text-[0.8rem] font-medium tracking-[0.02em] text-black/85 transition-colors duration-200 hover:bg-[#A01717] hover:text-white`}
              >
                <span>Try Socratic AI</span>
              </Link>
            </div>
          </div>

          <div className="hero-bottom-image-scroll pointer-events-none absolute inset-x-0 bottom-0 z-0">
            <div className="hero-load-up hero-load-up-image w-full">
              <Image
                src="/home/image3.jpeg"
                alt="Socratic AI hero visual"
                width={2400}
                height={1200}
                sizes="100vw"
                className="h-auto w-full object-contain object-bottom"
                priority
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
