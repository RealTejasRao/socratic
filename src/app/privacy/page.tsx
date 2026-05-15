import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Instrument_Serif, Inter } from "next/font/google";
import { Instagram, Linkedin, Mail, Youtube } from "lucide-react";
import { Footer } from "@/src/components/home/footer";
import { StaggeredMenu } from "@/src/components/home/staggered-menu";
import { resolveCloudinaryPublicAsset } from "@/src/lib/cloudinary-public-assets";
import { HOME_HERO_URL } from "@/src/lib/home-hero";
import { ROUTES } from "@/src/lib/routes";
import { createPageMetadata } from "@/src/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy",
  description:
    "Read Socratic AI's Privacy Policy to understand how we collect, use, and protect your personal information.",
  path: "/privacy",
});

async function getPrivacyPolicyHtml() {
  const policyPath = path.join(
    process.cwd(),
    "public",
    "instruction",
    "instruction.txt",
  );
  return fs.readFile(policyPath, "utf8");
}

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
  { label: "Home", href: ROUTES.HOME },
  { label: "Features", href: `${ROUTES.HOME}#features` },
  { label: "Use Cases", href: `${ROUTES.HOME}#use-cases` },
  { label: "Blog", href: ROUTES.BLOG },
  { label: "Contact", href: `${ROUTES.HOME}#contact` },
];

export default async function PrivacyPolicyPage() {
  const privacyPolicyHtml = await getPrivacyPolicyHtml();
  const socialLinks = [
    {
      label: "X",
      href: "https://x.com/useSocraticAI",
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.847h-7.406l-5.8-7.584-6.639 7.584H.474l8.599-9.83L0 1.154h7.594l5.243 6.932zM17.61 20.644h2.039L6.486 3.24H4.298z" />
        </svg>
      ),
    },
    {
      label: "Email",
      href: "mailto:contact@usesocratic.com",
      icon: <Mail size={14} />,
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/company/usesocratic/",
      icon: <Linkedin size={14} />,
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/usesocratic/",
      icon: <Instagram size={14} />,
    },
    {
      label: "YouTube",
      href: "https://www.youtube.com/@useSocraticAI",
      icon: <Youtube size={14} />,
    },
  ];

  return (
    <main className="min-h-screen bg-white text-black">
      <header className="fixed inset-x-0 top-0 z-50 flex flex-col border-b border-black/6 bg-white/60 px-5 py-0 backdrop-blur-md supports-backdrop-filter:bg-white/50 sm:px-7 sm:pt-1.5 sm:pb-0">
        <nav className="relative mx-auto flex h-16 w-full max-w-365 items-center justify-between sm:h-auto">
          <Link
            href={ROUTES.HOME}
            className="hero-load-up hero-load-up-nav-logo group relative flex h-11 w-fit items-center sm:h-8.5"
          >
            <div className="shrink-0 overflow-hidden">
              <Image
                src={resolveCloudinaryPublicAsset("/brand/Logo_Dark_SVG.svg")}
                alt="Socratic AI logo"
                width={50}
                height={50}
                className="h-12 w-12 object-contain transition duration-500 ease-out group-hover:-translate-y-0.5 group-hover:scale-[1.02] sm:h-10 sm:w-10"
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
          </Link>

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
            <Link
              href={HOME_HERO_URL}
              className={`${interClassName} hero-load-up hero-load-up-nav-cta inline-flex h-9 min-w-24 items-center justify-center rounded-full border border-black/18 bg-black px-5 text-[0.82rem] font-medium tracking-[0.02em] text-white transition-all duration-250 hover:-translate-y-0.5 hover:bg-black/92 sm:h-7.5 sm:min-w-22 sm:px-4.5 sm:text-[0.76rem]`}
            >
              Try Socratic AI
            </Link>

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

      <section className="px-5 pt-30 pb-20 sm:px-7 sm:pt-34">
        <div className="mx-auto w-full max-w-365">
          <div className="grid gap-8 lg:grid-cols-[56px_minmax(0,1fr)] lg:gap-16">
            <aside className="lg:sticky lg:top-32 lg:h-fit">
              <ul className="flex items-center gap-2.5 lg:flex-col lg:items-start">
                {socialLinks.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                      aria-label={item.label}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/12 text-black/74 transition-colors duration-200 hover:border-[#a01717]/45 hover:text-[#a01717]"
                    >
                      {item.icon}
                    </a>
                  </li>
                ))}
              </ul>
            </aside>

            <div className="w-full max-w-220">
              <div className="mb-7">
                <p
                  className={`${interClassName} text-[0.76rem] font-semibold tracking-[0.14em] text-[#a01717] uppercase`}
                >
                  Legal
                </p>
                <h1
                  className={`${instrumentSerif.className} mt-3 text-[clamp(2.3rem,5.5vw,4.9rem)] leading-[1.04] tracking-normal text-black`}
                >
                  Privacy Policy
                </h1>
              </div>

              <article
                className={`${interClassName} border-t border-black/10 pt-6 text-[1.03rem] leading-[1.75] text-black/84`}
                dangerouslySetInnerHTML={{ __html: privacyPolicyHtml }}
              />
            </div>
          </div>
        </div>
      </section>

      <Footer interClassName={interClassName} sectionPrefix={ROUTES.HOME} />
    </main>
  );
}
