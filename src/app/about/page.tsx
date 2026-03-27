import { readFile } from "node:fs/promises";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Inter, Poppins } from "next/font/google";
import { AboutContent } from "@/src/components/about/about-content";
import { Footer } from "@/src/components/home/footer";
import { StaggeredMenu } from "@/src/components/home/staggered-menu";
import { SpiralAnimation } from "@/src/components/ui/spiral-animation";
import { TypewriterHeading } from "@/src/components/ui/typewriter-heading";
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
  { label: "Home", href: ROUTES.HOME },
  { label: "Features", href: `${ROUTES.HOME}#features` },
  { label: "Use Cases", href: `${ROUTES.HOME}#use-cases` },
  { label: "About", href: ROUTES.ABOUT },
  { label: "Contact", href: `${ROUTES.HOME}#contact` },
];

async function getAboutParagraphs() {
  const filePath = path.join(
    process.cwd(),
    "public",
    "media",
    "About",
    "content.txt"
  );
  const content = await readFile(filePath, "utf8");

  return content
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export default async function AboutPage() {
  const paragraphs = await getAboutParagraphs();

  return (
    <main className={`min-h-screen bg-white ${poppins.className}`}>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-black/6 bg-white/60 px-6 pt-3 backdrop-blur-md supports-backdrop-filter:bg-white/50 sm:px-8 sm:pt-4">
        <nav className="relative mx-auto flex w-full max-w-365 items-center justify-between">
          <a
            href={ROUTES.HOME}
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

      <section className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-white">
          <SpiralAnimation />
        </div>
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <TypewriterHeading
            text="About Us"
            className={`${inter.className} inline-flex items-center text-[clamp(1.15rem,3.4vw,2.75rem)] font-medium tracking-[-0.02em] text-black`}
          />
        </div>

        <div className="pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2 sm:bottom-9">
          <span
            className="inline-flex animate-bounce text-[1.25rem] text-black/78"
            aria-hidden="true"
          >
            ↓
          </span>
        </div>
      </section>

      <AboutContent interClassName={poppins.className} paragraphs={paragraphs} />
      <Footer interClassName={inter.className} sectionPrefix={ROUTES.HOME} />
    </main>
  );
}
