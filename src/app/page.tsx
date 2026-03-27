import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Inter, Poppins } from "next/font/google";
import { GLSLHills } from "@/src/components/ui/glsl-hills";
import { LoadGate } from "@/src/components/ui/load-gate";
import { TypewriterHeading } from "@/src/components/ui/typewriter-heading";
import { FeaturesSection } from "@/src/components/home/features-section";
import { HomeHashScroll } from "@/src/components/home/home-hash-scroll";
import { SecuritySeparator } from "@/src/components/home/security-separator";
import { UseCasesSection } from "@/src/components/home/use-cases-section";
import { ContactSection } from "@/src/components/home/contact-section";
import { Footer } from "@/src/components/home/footer";
import { StaggeredMenu } from "@/src/components/home/staggered-menu";
import { ROUTES } from "@/src/lib/routes";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500"],
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
      fallbackClassName={`min-h-screen w-full bg-white ${poppins.className}`}
    >
      <main
        className={`relative min-h-screen overflow-hidden bg-white ${poppins.className}`}
      >
        <HomeHashScroll />
        <header className="fixed inset-x-0 top-0 z-50 border-b border-black/6 bg-white/60 px-6 pt-3 backdrop-blur-md supports-backdrop-filter:bg-white/50 sm:px-8 sm:pt-4">
          <nav className="relative mx-auto flex w-full max-w-365 items-center justify-between">
            <a
              href="#"
              className="group relative flex h-9.5 w-fit cursor-pointer items-center"
            >
              <div className="shrink-0 overflow-hidden">
                <Image
                  src="/brand/Logo_Dark_SVG.svg"
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
              <SignedOut>
                <Link
                  href={ROUTES.SIGN_IN}
                  className="cursor-pointer border border-black/12 px-4 py-2 text-[0.88rem] font-medium text-black transition-colors duration-200 hover:bg-black/3 sm:px-5"
                >
                  Sign in
                </Link>
                <Link
                  href={ROUTES.SIGN_UP}
                  className="cursor-pointer border border-black/12 bg-black px-4 py-2 text-[0.88rem] font-medium text-white transition-colors duration-200 hover:bg-black/90 sm:px-5"
                >
                  Sign up
                </Link>
              </SignedOut>

              <SignedIn>
                <div className="flex items-center gap-3">
                  <Link
                    href={ROUTES.APP}
                    className="cursor-pointer border border-black/12 bg-black px-4 py-2 text-[0.88rem] font-medium text-white transition-colors duration-200 hover:bg-black/90 sm:px-5"
                  >
                    Open app
                  </Link>
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonTrigger: "!h-[35px] !w-[35px]",
                        userButtonAvatarBox: "!h-[35px] !w-[35px]",
                      },
                    }}
                  />
                </div>
              </SignedIn>

              <StaggeredMenu
                items={navLinks.map((link) => ({
                  label: link.label,
                  link: link.href,
                  ariaLabel: `Go to ${link.label}`,
                }))}
              />
            </div>
          </nav>

          <div className="mx-auto mt-2 w-full max-w-365">
            <div className="h-px w-full bg-[radial-gradient(circle,rgba(120,120,120,0.45)_1px,transparent_1.2px)] bg-position-[left_center] bg-size-[10px_1px] bg-repeat-x" />
          </div>
        </header>

        <section className="relative h-screen w-full">
          <GLSLHills className="hero-bg-fade" />
          <div className="hero-content-fade absolute inset-0 flex items-center justify-center px-6">
            <div className="mt-4 flex max-w-190 flex-col items-center text-center">
              <p className="mb-4 inline-flex items-center gap-2 text-[0.78rem] font-light tracking-[0.02em] text-black/60 sm:text-[0.8rem]">
                <span
                  className="relative inline-flex h-2.5 w-2.5 items-center justify-center"
                  aria-hidden="true"
                >
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/55" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span>Your personal AI for Philosophy.</span>
              </p>
              <h1 className="mt-3">
                <TypewriterHeading
                  text="Stop Scrolling. Start Thinking"
                  className={`${inter.className} inline-flex items-center whitespace-nowrap text-[clamp(1rem,2.5vw,2.2rem)] font-medium leading-[1.08] text-black`}
                />
              </h1>
              <p className="mt-5 text-[clamp(0.75rem,1vw,0.95rem)] text-black/70">
                Built for the restless mind.
              </p>
              <p className="mt-0.5 text-[clamp(0.75rem,1vw,0.95rem)] text-black/70">
                From ethics to existentialism, from logic to metaphysics.
              </p>
              <Link
                href={ROUTES.SIGN_UP}
                className="mt-6 inline-flex items-center gap-2 cursor-pointer border border-black/12 bg-black px-5 py-2 text-[0.84rem] font-medium text-white transition-colors duration-200 hover:bg-black/90"
              >
                <span>Try Socratic AI</span>
                <span aria-hidden="true">&gt;</span>
              </Link>
            </div>
          </div>
        </section>

        <FeaturesSection interClassName={inter.className} />
        <SecuritySeparator interClassName={inter.className} />
        <UseCasesSection interClassName={inter.className} />
        <ContactSection interClassName={inter.className} />
        <Footer interClassName={inter.className} />
      </main>
    </LoadGate>
  );
}
