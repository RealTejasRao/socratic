import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { StaggeredMenu } from "@/src/components/home/staggered-menu";
import { PremiumCrownIcon } from "@/src/components/billingsdk/premium-crown-icon";
import { MarketingNavAvatar } from "@/src/components/navigation/marketing-nav-avatar";
import { MarketingStandaloneBackLink } from "@/src/components/navigation/marketing-standalone-back-link";
import { AuthAwareCtaLink } from "@/src/components/navigation/auth-aware-cta-link";
import { StandaloneModeGate } from "@/src/components/pwa/standalone-mode-gate";
import { ROUTES } from "@/src/lib/routes";
import { getUserBillingStateByClerkId } from "@/src/server/billing/access";

type MarketingNavbarProps = {
  interClassName: string;
  instrumentSerifClassName: string;
  homeHref?: string;
  sectionPrefix?: string;
  standaloneAction?: "upgrade" | "back";
};

export async function MarketingNavbar({
  interClassName,
  instrumentSerifClassName,
  homeHref = ROUTES.HOME,
  sectionPrefix = "",
  standaloneAction = "upgrade",
}: MarketingNavbarProps) {
  const { userId: clerkUserId } = await auth();
  const billing = clerkUserId
    ? await getUserBillingStateByClerkId(clerkUserId)
    : null;
  const isPremium = Boolean(billing?.isPremium);
  const pricingLabel = isPremium ? "Socratic +" : "Pricing";
  const pricingHref = isPremium ? ROUTES.APP_BILLING : ROUTES.PRICING;
  const withPrefix = (hash: string) => (sectionPrefix ? `${sectionPrefix}${hash}` : hash);
  const navLinks = [
    { label: "Home", href: homeHref },
    { label: "Features", href: withPrefix("#features") },
    { label: pricingLabel, href: pricingHref },
    { label: "Blog", href: ROUTES.BLOG },
    { label: "Contact", href: withPrefix("#contact") },
  ];
  const logoLabel = (
    <>
      <div className="shrink-0 overflow-hidden">
        <Image
          src="/brand/Logo_Dark_SVG.svg"
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
          className={`${instrumentSerifClassName} -translate-x-4.5 whitespace-nowrap text-[1.15rem] font-normal tracking-[0.01em] text-black/78 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0 group-hover:opacity-100`}
        >
          Socratic AI
        </span>
      </div>
    </>
  );

  const browserNavbar = (
    <header className="fixed inset-x-0 top-0 z-50 flex flex-col border-b border-black/6 bg-white/60 px-5 py-0 backdrop-blur-md supports-backdrop-filter:bg-white/50 sm:px-7 sm:pt-1.5 sm:pb-0">
      <nav className="relative mx-auto flex h-16 w-full max-w-365 items-center justify-between sm:h-auto">
        <a
          href={homeHref}
          className="hero-load-up hero-load-up-nav-logo group relative flex h-11 w-fit cursor-pointer items-center sm:h-8.5"
        >
          {logoLabel}
        </a>

        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-center lg:flex">
          <div className="pointer-events-auto flex items-center justify-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`${interClassName} hero-load-up cursor-pointer text-[0.8rem] font-normal text-black/65 antialiased [text-rendering:optimizeLegibility] transition-colors duration-200 hover:text-black`}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <AuthAwareCtaLink
            signedOutHref={ROUTES.SIGN_UP}
            showPendingStateOnNavigate
            pendingIndicator="roseCurve"
            className={`${interClassName} hero-load-up hero-load-up-nav-cta inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-black px-4 text-[0.72rem] font-medium tracking-[0.03em] text-white transition-all duration-200 hover:bg-[#a01717] sm:px-5 sm:text-[0.76rem]`}
          >
            Open App
          </AuthAwareCtaLink>

          {isPremium ? (
            <Link
              href={ROUTES.APP_BILLING}
              aria-label="Manage your billing"
              className="hero-load-up hero-load-up-nav-cta inline-flex h-11 w-11 items-center justify-center rounded-full p-0 transition-transform duration-250 hover:-translate-y-0.5 lg:h-12 lg:w-12"
            >
              <span className="sr-only">Manage your billing</span>
              <PremiumCrownIcon
                className="h-[2.15rem] w-[2.15rem] lg:h-9 lg:w-9"
                crownClassName="h-[1em] w-[1em]"
              />
            </Link>
          ) : null}

          <MarketingNavAvatar className="hero-load-up hero-load-up-nav-cta" />

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
  );

  const standaloneNavbar = (
    <header className="fixed inset-x-0 top-0 z-60 border-b border-black/8 bg-white/94 px-3 pt-[calc(0.35rem+env(safe-area-inset-top))] pb-1.5 backdrop-blur-md sm:px-4">
      <nav className="relative mx-auto flex h-12 w-full max-w-105 items-center justify-between">
        <MarketingNavAvatar />
        <a
          href={homeHref}
          aria-label="Socratic AI home"
          className="absolute left-1/2 flex h-10 -translate-x-1/2 items-center justify-center"
        >
          <Image
            src="/brand/Logo_Dark_SVG.svg"
            alt="Socratic AI logo"
            width={42}
            height={42}
            className="h-9 w-9 object-contain"
            priority
          />
        </a>
        {standaloneAction === "back" ? (
          <MarketingStandaloneBackLink
            className={`${interClassName} inline-flex h-9 min-w-16 items-center justify-center gap-1.5 rounded-full px-3 text-[0.84rem] font-semibold tracking-[0.01em] text-[#a01717] transition-colors hover:bg-[#a01717]/8`}
          />
        ) : (
          <a
            href={pricingHref}
            className={`${interClassName} inline-flex h-9 min-w-14 items-center justify-center rounded-full px-3 text-[0.84rem] font-semibold tracking-[0.01em] text-[#a01717] transition-colors hover:bg-[#a01717]/8`}
          >
            Upgrade
          </a>
        )}
      </nav>
    </header>
  );

  return (
    <StandaloneModeGate browser={browserNavbar} standalone={standaloneNavbar} />
  );
}
