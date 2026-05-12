import Image from "next/image";
import { Instagram, Linkedin, Mail, Youtube } from "lucide-react";
import { ROUTES } from "@/src/lib/routes";
import { resolveCloudinaryPublicAsset } from "@/src/lib/cloudinary-public-assets";

type FooterProps = {
  interClassName: string;
  sectionPrefix?: string;
};

export function Footer({ interClassName, sectionPrefix = "" }: FooterProps) {
  const withPrefix = (hash: string) =>
    sectionPrefix ? `${sectionPrefix}${hash}` : hash;
  const siteMapLinks = [
    { label: "Home", href: withPrefix("#home") },
    { label: "Features", href: withPrefix("#features") },
    { label: "Use Cases", href: withPrefix("#use-cases") },
    { label: "Blog", href: ROUTES.BLOG },
    { label: "Contact", href: withPrefix("#contact") },
  ];
  const topAnchorLink = withPrefix("#home");
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
      href: "mailto:usesocratic@gmail.com",
      icon: <Mail size={15} />,
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/company/usesocratic/",
      icon: <Linkedin size={15} />,
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/usesocratic/",
      icon: <Instagram size={15} />,
    },
    {
      label: "YouTube",
      href: "https://www.youtube.com/@useSocraticAI",
      icon: <Youtube size={15} />,
    },
  ];

  return (
    <footer className="border-t border-white/16 bg-[#171717] px-5 pt-12 pb-7 sm:px-7 sm:pt-14 sm:pb-8">
      <div className="relative">
        <div className="mx-auto w-full max-w-330">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
            <div>
              <div className="flex items-center gap-2.5">
                <Image
                  src={resolveCloudinaryPublicAsset("/brand/Logo_Dark_SVG.svg")}
                  alt="Socratic AI logo"
                  width={40}
                  height={40}
                  className="h-10 w-10 invert"
                />
                <span className={`${interClassName} text-[1rem] text-white/95`}>
                  Socratic AI
                </span>
              </div>

              <p
                className={`${interClassName} mt-4 max-w-118 text-[0.9rem] leading-relaxed text-white/78 sm:text-[0.95rem]`}
              >
                Built on the greatest philosophical texts ever written. <br></br> Ask anything. Debate Everything
              </p>

              <ul className="mt-6 flex flex-wrap items-center gap-2.5">
                {socialLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={
                        link.href.startsWith("http") ? "_blank" : undefined
                      }
                      rel={
                        link.href.startsWith("http")
                          ? "noreferrer noopener"
                          : undefined
                      }
                      aria-label={link.label}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-[3px] border border-white/28 bg-white/7 text-white/88 transition-colors duration-200 hover:bg-white/14 hover:text-white"
                    >
                      {link.icon}
                    </a>
                  </li>
                ))}
              </ul>

              <a
                href={topAnchorLink}
                className={`${interClassName} mt-6 inline-flex min-h-12 items-center justify-center rounded-[3px] border border-[#a01717] bg-[#a01717] px-7 text-[0.86rem] font-semibold tracking-[0.04em] text-white uppercase transition-colors duration-200 hover:bg-[#871313]`}
              >
                Get Early Access
              </a>
            </div>

            <div className="grid gap-7 sm:grid-cols-2 sm:gap-9">
              <div>
                <p
                  className={`${interClassName} text-[0.76rem] tracking-[0.12em] text-white/92 uppercase`}
                >
                  Explore
                </p>
                <ul className="mt-4 space-y-2.5">
                  {siteMapLinks.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className={`${interClassName} text-[0.92rem] text-white/76 transition-colors duration-200 hover:text-white`}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p
                  className={`${interClassName} text-[0.76rem] tracking-[0.12em] text-white/92 uppercase`}
                >
                  Account
                </p>
                <ul className="mt-4 space-y-2.5">
                  <li>
                    <a
                      href={topAnchorLink}
                      className={`${interClassName} text-[0.92rem] text-white/76 transition-colors duration-200 hover:text-white`}
                    >
                      Early Access
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/16 pt-4.5">
            <p
              className={`${interClassName} text-center text-[0.74rem] text-white/56`}
            >
              © 2026 Socratic AI. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
