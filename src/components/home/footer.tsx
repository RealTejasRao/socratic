import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
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
    <footer className="border-t border-white/10 bg-[#141414] px-5 py-5 sm:px-7 sm:py-6">
      <div className="mx-auto w-full max-w-330">
        <div className="flex flex-col items-center justify-between gap-3.5 lg:flex-row">
          <div className="flex items-center gap-2.5">
            <Image
              src={resolveCloudinaryPublicAsset("/brand/Logo_Dark_SVG.svg")}
              alt="Socratic AI logo"
              width={38}
              height={38}
              className="h-8 w-8 invert"
            />
            <span className={`${interClassName} text-[0.78rem] text-white/90`}>
              Socratic AI
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4.5 gap-y-1.5">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[0.66rem] text-white/62 transition-colors duration-200 hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>

          <SignedOut>
            <Link
              href={ROUTES.SIGN_UP}
              className="inline-flex items-center gap-2 border border-white/18 bg-transparent px-3.5 py-1.75 text-[0.66rem] text-white transition-[background-color,color,border-color] duration-200 hover:!bg-white hover:text-black"
            >
              <span>Try Socratic AI</span>
              <span aria-hidden="true">&gt;</span>
            </Link>
          </SignedOut>

          <SignedIn>
            <Link
              href={ROUTES.APP}
              className="inline-flex items-center gap-2 border border-white/18 bg-transparent px-3.5 py-1.75 text-[0.66rem] text-white transition-[background-color,color,border-color] duration-200 hover:!bg-white hover:text-black"
            >
              <span>Try Socratic AI</span>
              <span aria-hidden="true">&gt;</span>
            </Link>
          </SignedIn>
        </div>

        <div className="mt-4 border-t border-white/10 pt-2.5">
          <p
            className={`${interClassName} text-center text-[0.62rem] text-white/50`}
          >
            © 2026 Socratic AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
