"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Cookie, Sparkles } from "lucide-react";
import {
  COOKIE_CONSENT_DEFAULT_PREFERENCES,
  COOKIE_CONSENT_OPEN_EVENT,
  COOKIE_CONSENT_OPTIONAL_CATEGORIES,
  type CookieConsentCategory,
  type CookieConsentPreferences,
  createCookieConsentRecord,
  persistCookieConsent,
  readStoredCookieConsent,
} from "@/src/lib/cookie-consent";
import { useStandaloneMode } from "@/src/hooks/use-standalone-mode";
import { ROUTES } from "@/src/lib/routes";

type CookieEntry = {
  name: string;
  purpose: string;
  type: string;
  expiresIn: string;
  provider: string;
  providerPolicyUrl?: string;
};

type CookieCategoryConfig = {
  id: CookieConsentCategory;
  title: string;
  description: string;
  required?: boolean;
  cookies: CookieEntry[];
};

const COOKIE_CATEGORIES: CookieCategoryConfig[] = [
  {
    id: "essential",
    title: "Essential Cookies",
    description:
      "These cookies are required for core functionality such as security, routing, and account access.",
    required: true,
    cookies: [
      {
        name: "__cf_bm",
        purpose: "Cloudflare bot-management cookie used to protect the site from malicious traffic.",
        type: "http_cookie",
        expiresIn: "30 minutes",
        provider: ".usesocratic.com",
        providerPolicyUrl: "https://www.cloudflare.com/privacypolicy/",
      },
      {
        name: "__clerk_db_jwt",
        purpose: "Clerk session cookie that keeps authenticated users signed in securely.",
        type: "http_cookie",
        expiresIn: "Session",
        provider: ".clerk.usesocratic.com",
      },
      {
        name: "__session",
        purpose: "App-level session cookie used for secure request continuity.",
        type: "http_cookie",
        expiresIn: "Session",
        provider: ".usesocratic.com",
      },
    ],
  },
  {
    id: "performance",
    title: "Performance and Functionality Cookies",
    description:
      "These cookies improve reliability and performance. Turning them off can limit some functionality.",
    cookies: [
      {
        name: "_cfuvid",
        purpose:
          "Cloudflare cookie used for rate-limiting and secure performance handling across requests.",
        type: "server_cookie",
        expiresIn: "Session",
        provider: ".clerk.usesocratic.com",
        providerPolicyUrl:
          "https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/",
      },
    ],
  },
  {
    id: "analytics",
    title: "Analytics and Customization Cookies",
    description:
      "These cookies help us understand website usage and measure effectiveness so we can improve experience.",
    cookies: [],
  },
  {
    id: "advertising",
    title: "Advertising Cookies",
    description:
      "These cookies support advertising relevance and campaign measurement across services.",
    cookies: [],
  },
  {
    id: "social",
    title: "Social Networking Cookies",
    description:
      "These cookies support sharing features and social integrations with third-party platforms.",
    cookies: [],
  },
  {
    id: "unclassified",
    title: "Unclassified Cookies",
    description:
      "These cookies are being reviewed and categorized as part of ongoing cookie-audit work.",
    cookies: [
      {
        name: "__cflb",
        purpose: "Cloudflare load-balancer cookie used to maintain consistency across requests.",
        type: "server_cookie",
        expiresIn: "1 day",
        provider: ".usesocratic.com",
      },
      {
        name: "cf_ob_info",
        purpose: "Cloudflare Always Online metadata cookie used during fallback responses.",
        type: "server_cookie",
        expiresIn: "30 seconds",
        provider: ".usesocratic.com",
      },
      {
        name: "cf_use_ob",
        purpose: "Cloudflare Always Online cookie to control origin fallback behavior.",
        type: "server_cookie",
        expiresIn: "Persistent",
        provider: ".usesocratic.com",
      },
      {
        name: "cfz_google-analytics_v4",
        purpose: "Cloudflare Zaraz cookie key used for optional analytics integration.",
        type: "server_cookie",
        expiresIn: "Persistent",
        provider: ".usesocratic.com",
      },
    ],
  },
];

function createAllAllowedPreferences(): CookieConsentPreferences {
  return {
    essential: true,
    performance: true,
    analytics: true,
    advertising: true,
    social: true,
    unclassified: true,
  };
}

function createDeclinedPreferences(): CookieConsentPreferences {
  return {
    ...COOKIE_CONSENT_DEFAULT_PREFERENCES,
    essential: true,
  };
}

function CookieCategoryRow({
  category,
  checked,
  onToggle,
  onDetails,
}: {
  category: CookieCategoryConfig;
  checked: boolean;
  onToggle: (category: CookieConsentCategory, value: boolean) => void;
  onDetails: (category: CookieConsentCategory) => void;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-white/95 px-4 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <label className={`flex items-start gap-3 text-black ${category.required ? "" : "cursor-pointer"}`}>
          <input
            type="checkbox"
            checked={checked}
            disabled={category.required}
            onChange={(event) => onToggle(category.id, event.target.checked)}
            className="mt-0.5 h-5 w-5 cursor-pointer rounded border-black/30 accent-[#a01717]"
          />
          <span>
            <span className={`text-[1rem] ${category.required ? "text-black/55" : "font-semibold"}`}>
              {category.title} ({category.cookies.length})
            </span>
            {category.required ? (
              <span className="ml-2 inline-flex rounded-full bg-black/7 px-2.5 py-0.5 text-[0.74rem] font-medium text-black/70">
                Always on
              </span>
            ) : null}
          </span>
        </label>

        <button
          type="button"
          onClick={() => onDetails(category.id)}
          className="shrink-0 cursor-pointer rounded-full border border-black/14 px-3 py-1 text-[0.84rem] font-medium text-black/80 transition-colors hover:bg-black/5"
        >
          Details
        </button>
      </div>

      <p className="mt-2 pl-8 pr-1 text-[0.94rem] leading-relaxed text-black/72">{category.description}</p>
    </div>
  );
}

export function CookieConsentManager() {
  const pathname = usePathname();
  const isStandalone = useStandaloneMode();
  const [isReady, setIsReady] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [hasDecision, setHasDecision] = useState(false);
  const [detailCategory, setDetailCategory] = useState<CookieConsentCategory | null>(null);
  const [preferences, setPreferences] = useState<CookieConsentPreferences>(
    COOKIE_CONSENT_DEFAULT_PREFERENCES,
  );

  const detailCategoryConfig = useMemo(
    () => COOKIE_CATEGORIES.find((category) => category.id === detailCategory) ?? null,
    [detailCategory],
  );
  const isPolicyPage =
    pathname === ROUTES.COOKIE_POLICY || pathname === ROUTES.PRIVACY_POLICY;

  useEffect(() => {
    const stored = readStoredCookieConsent();
    if (stored) {
      setPreferences(stored.preferences);
      setHasDecision(true);
    }

    setIsReady(true);

    const handleOpen = () => {
      if (isPolicyPage) {
        return;
      }

      setDetailCategory(null);
      setIsPreferencesOpen(true);
    };

    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, handleOpen);
  }, [isPolicyPage]);

  useEffect(() => {
    if (!isPolicyPage) {
      return;
    }

    setDetailCategory(null);
    setIsPreferencesOpen(false);
  }, [isPolicyPage]);

  useEffect(() => {
    if (!isPreferencesOpen) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDetailCategory(null);
        setIsPreferencesOpen(false);
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isPreferencesOpen]);

  useEffect(() => {
    if (!isPreferencesOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isPreferencesOpen]);

  const showBanner = isReady && !hasDecision && !isPreferencesOpen && !isPolicyPage;

  if (isStandalone) {
    return null;
  }

  const toggleCategory = (category: CookieConsentCategory, value: boolean) => {
    if (!COOKIE_CONSENT_OPTIONAL_CATEGORIES.includes(category)) {
      return;
    }

    setPreferences((current) => ({
      ...current,
      [category]: value,
      essential: true,
    }));
  };

  const allowAll = () => {
    const next = createAllAllowedPreferences();
    const record = createCookieConsentRecord(next, "accept_all");
    persistCookieConsent(record);
    setPreferences(next);
    setHasDecision(true);
    setDetailCategory(null);
    setIsPreferencesOpen(false);
  };

  const declineAll = () => {
    const next = createDeclinedPreferences();
    const record = createCookieConsentRecord(next, "decline_all");
    persistCookieConsent(record);
    setPreferences(next);
    setHasDecision(true);
    setDetailCategory(null);
    setIsPreferencesOpen(false);
  };

  const saveSelectedPreferences = () => {
    const record = createCookieConsentRecord(preferences, "save_preferences");
    persistCookieConsent(record);
    setHasDecision(true);
    setDetailCategory(null);
    setIsPreferencesOpen(false);
  };

  return (
    <>
      {showBanner ? (
        <section className="fixed inset-0 z-120 flex items-center justify-center bg-black/45 px-4 py-5 backdrop-blur-[2px] sm:px-6">
          <div className="relative w-full max-w-140 overflow-hidden rounded-2xl border border-black/12 bg-white p-6 shadow-[0_28px_70px_rgba(0,0,0,0.35)] sm:p-7">
            <button
              type="button"
              onClick={allowAll}
              className="absolute right-5 top-5 z-10 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-black/12 text-[1.25rem] leading-none text-black/72 transition-transform transition-colors duration-200 hover:rotate-90 hover:bg-black/5 hover:text-black sm:right-6 sm:top-6"
              aria-label="Close and accept all cookies"
            >
              ×
            </button>
            <div className="pointer-events-none absolute -right-10 -top-12 h-38 w-38 rounded-full bg-[#a01717]/10 blur-2xl" />
            <div className="pointer-events-none absolute -left-8 bottom-3 h-26 w-26 rounded-full bg-black/7 blur-xl" />

            <div className="relative">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white">
                <Cookie className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-[1.55rem] leading-tight font-semibold text-black">
                Cookies, but on your terms :)
              </h2>
              <p className="mt-2 text-[0.98rem] leading-relaxed text-black/74">
                We use cookies for security, performance, and experience. Choose
                what to allow now, and update your preferences anytime.
              </p>
              <p className="mt-3 text-[0.88rem] leading-relaxed text-black/60">
                Closing this prompt accepts all cookies. Read our{" "}
                <Link
                  className="underline underline-offset-2"
                  href={ROUTES.PRIVACY_POLICY}
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  className="underline underline-offset-2"
                  href={ROUTES.COOKIE_POLICY}
                >
                  Cookie Policy
                </Link>
                .
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setDetailCategory(null);
                  setIsPreferencesOpen(true);
                }}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-black/25 px-5 text-[0.95rem] font-medium text-black transition-colors hover:bg-black/5"
              >
                Preferences
              </button>
              <button
                type="button"
                onClick={allowAll}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-[#a01717] px-6 text-[0.95rem] font-semibold text-white transition-colors hover:bg-[#871313]"
              >
                Accept
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {isPreferencesOpen ? (
        <section
          className="fixed inset-0 z-130 flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          aria-modal="true"
          role="dialog"
          aria-label="Cookie preferences"
        >
          <div className="flex h-[92vh] w-full max-w-215x flex-col rounded-t-2xl border border-black/12 bg-[#f7f7f7] shadow-[0_30px_80px_rgba(0,0,0,0.34)] sm:h-[88vh] sm:rounded-2xl">
            <div className="relative flex items-center justify-between border-b border-black/10 px-5 py-4 pr-16 sm:px-6 sm:pr-16">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[1.28rem] font-semibold text-black">
                    Cookie Preferences
                  </h2>
                  <p className="text-[0.82rem] text-black/58">
                    Minimal controls, full transparency
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDetailCategory(null);
                  setIsPreferencesOpen(false);
                }}
                className="absolute right-5 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-black/12 text-[1.25rem] leading-none text-black/72 transition-transform transition-colors duration-200 hover:rotate-90 hover:bg-black/5 hover:text-black sm:right-6"
                aria-label="Close cookie preferences"
              >
                ×
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              {!detailCategoryConfig ? (
                <>
                  <div className="rounded-xl border border-black/10 bg-white px-4 py-4 sm:px-5">
                    <p className="text-[0.96rem] leading-relaxed text-black/78">
                      Choose which optional cookies we can use. Essential
                      cookies stay on for security and core functionality.
                    </p>
                    <p className="mt-2 text-[0.93rem] leading-relaxed text-black/68">
                      Learn more in our{" "}
                      <Link
                        className="underline underline-offset-2"
                        href={ROUTES.COOKIE_POLICY}
                      >
                        Cookie Policy
                      </Link>{" "}
                      and{" "}
                      <Link
                        className="underline underline-offset-2"
                        href={ROUTES.PRIVACY_POLICY}
                      >
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {COOKIE_CATEGORIES.map((category) => (
                      <CookieCategoryRow
                        key={category.id}
                        category={category}
                        checked={preferences[category.id]}
                        onToggle={toggleCategory}
                        onDetails={setDetailCategory}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => setDetailCategory(null)}
                    className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1 rounded-md border border-black/22 bg-white px-4 text-[0.94rem] font-medium text-black transition-colors hover:bg-black/5"
                  >
                    <span aria-hidden="true">‹</span> Back
                  </button>

                  <h3 className="mt-5 text-[1.7rem] leading-tight font-semibold text-black sm:text-[1.9rem]">
                    {detailCategoryConfig.title}
                  </h3>

                  <p className="mt-3 text-[0.96rem] leading-relaxed text-black/75">
                    {detailCategoryConfig.description}
                  </p>

                  <h4 className="mt-6 text-[1.35rem] leading-tight font-semibold text-black sm:text-[1.5rem]">
                    Provider{" "}
                    {detailCategoryConfig.cookies[0]?.provider ??
                      ".usesocratic.com"}
                  </h4>

                  <div className="mt-3 overflow-x-auto rounded-xl border border-black/15 bg-white">
                    <table className="w-full min-w-160 border-collapse text-left">
                      <thead className="bg-black text-white">
                        <tr>
                          <th className="px-5 py-3.5 text-[0.95rem] font-semibold">
                            Name
                          </th>
                          <th className="px-5 py-3.5 text-[0.95rem] font-semibold">
                            Purpose
                          </th>
                          <th className="px-5 py-3.5 text-[0.95rem] font-semibold">
                            Type
                          </th>
                          <th className="px-5 py-3.5 text-[0.95rem] font-semibold">
                            Expires In
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailCategoryConfig.cookies.length > 0 ? (
                          detailCategoryConfig.cookies.map((cookie) => (
                            <tr
                              key={`${detailCategoryConfig.id}-${cookie.name}`}
                              className="border-t border-black/10"
                            >
                              <td className="align-top px-5 py-4 text-[0.94rem] leading-relaxed text-black">
                                <div>{cookie.name}</div>
                                {cookie.providerPolicyUrl ? (
                                  <a
                                    href={cookie.providerPolicyUrl}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="mt-1 inline-block text-[0.86rem] text-black/72 underline underline-offset-2"
                                  >
                                    Privacy policy
                                  </a>
                                ) : null}
                              </td>
                              <td className="align-top px-5 py-4 text-[0.94rem] leading-relaxed text-black/86">
                                {cookie.purpose}
                              </td>
                              <td className="align-top px-5 py-4 text-[0.94rem] leading-relaxed text-black/86">
                                {cookie.type}
                              </td>
                              <td className="align-top px-5 py-4 text-[0.94rem] leading-relaxed text-black/86">
                                {cookie.expiresIn}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-5 py-5 text-[0.95rem] text-black/72"
                            >
                              No cookies are currently mapped in this category.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {!detailCategoryConfig ? (
              <div className="border-t border-black/10 bg-white/75 px-5 py-4 sm:px-6">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={declineAll}
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-black/20 bg-white px-4 text-[0.95rem] font-semibold text-black transition-colors hover:bg-black/5"
                  >
                    Decline All
                  </button>
                  <button
                    type="button"
                    onClick={saveSelectedPreferences}
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-black px-4 text-[0.95rem] font-semibold text-white transition-colors hover:bg-black/86"
                  >
                    Save Preferences
                  </button>
                  <button
                    type="button"
                    onClick={allowAll}
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-[#a01717] px-4 text-[0.95rem] font-semibold text-white transition-colors hover:bg-[#871313]"
                  >
                    Allow All
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}
