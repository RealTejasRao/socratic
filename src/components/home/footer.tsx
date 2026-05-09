import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import { ROUTES } from "@/src/lib/routes";
import { resolveCloudinaryPublicAsset } from "@/src/lib/cloudinary-public-assets";

type FooterProps = {
  interClassName: string;
  sectionPrefix?: string;
};

export function Footer({ interClassName, sectionPrefix = "" }: FooterProps) {
  const withPrefix = (hash: string) =>
    sectionPrefix ? `${sectionPrefix}${hash}` : hash;
  const footerLinks = [
    { label: "Home", href: sectionPrefix || "#" },
    { label: "Features", href: withPrefix("#features") },
    { label: "Use Cases", href: withPrefix("#use-cases") },
    { label: "Contact", href: withPrefix("#contact") },
  ];

  return (
    <footer className="border-t border-white/10 bg-[#141414] px-5 py-7 sm:px-7 sm:py-6">
      <div className="mx-auto w-full max-w-330">
        <div className="flex flex-col items-stretch gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-3.5">
          <div className="flex items-center justify-center gap-2.5 lg:justify-start">
            <Image
              src={resolveCloudinaryPublicAsset("/brand/Logo_Dark_SVG.svg")}
              alt="Socratic AI logo"
              width={38}
              height={38}
              className="h-9 w-9 invert md:h-8 md:w-8"
            />
            <span className={`${interClassName} text-[1rem] text-white/90 md:text-[0.78rem]`}>
              Socratic AI
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap lg:items-center lg:justify-center lg:gap-x-4.5 lg:gap-y-1.5">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3.5 py-2 text-center text-[0.82rem] text-white/78 transition-colors duration-200 hover:text-white lg:px-0 lg:py-0 lg:text-[0.66rem] lg:text-white/62"
              >
                {link.label}
              </a>
            ))}
          </div>

          <SignedOut>
            <Link
              href={ROUTES.SIGN_UP}
              className="inline-flex w-full items-center justify-center gap-2 border border-white/18 bg-transparent px-4 py-2.5 text-[0.88rem] text-white transition-[background-color,color,border-color] duration-200 hover:!bg-white hover:text-black lg:w-auto lg:px-3.5 lg:py-1.75 lg:text-[0.66rem]"
            >
              <span>Try Socratic AI</span>
              <ArrowRight className="h-4 w-4 lg:h-3.25 lg:w-3.25" aria-hidden="true" />
            </Link>
          </SignedOut>

          <SignedIn>
            <Link
              href={ROUTES.APP}
              className="inline-flex w-full items-center justify-center gap-2 border border-white/18 bg-transparent px-4 py-2.5 text-[0.88rem] text-white transition-[background-color,color,border-color] duration-200 hover:!bg-white hover:text-black lg:w-auto lg:px-3.5 lg:py-1.75 lg:text-[0.66rem]"
            >
              <span>Try Socratic AI</span>
              <ArrowRight className="h-4 w-4 lg:h-3.25 lg:w-3.25" aria-hidden="true" />
            </Link>
          </SignedIn>
        </div>

        <div className="mt-5 border-t border-white/10 pt-3.5 md:mt-4 md:pt-2.5">
          <p
            className={`${interClassName} text-center text-[0.72rem] text-white/50 md:text-[0.62rem]`}
          >
            © 2026 Socratic AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
