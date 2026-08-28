"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { LoaderCircle } from "lucide-react";
import { useTransition } from "react";
import {
  UPSC_HOME_LOCALE_COOKIE,
  type UpscHomeLocale,
} from "@/src/lib/upsc-home-locale";

type MarketingLanguageToggleProps = {
  locale: UpscHomeLocale;
  label: string;
  className?: string;
};

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function MarketingLanguageToggle({
  locale,
  label,
  className = "",
}: MarketingLanguageToggleProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const nextLocale: UpscHomeLocale = locale === "hi" ? "en" : "hi";
  const iconLabel = nextLocale === "hi" ? "अ" : "A";

  const handleClick = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", nextLocale);
    document.cookie = `${UPSC_HOME_LOCALE_COOKIE}=${nextLocale}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
    const query = params.toString();
    startTransition(() => {
      router.replace(`${pathname}${query ? `?${query}` : ""}` as Route, {
        scroll: false,
      });
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={className}
      aria-label={`Switch language to ${nextLocale === "hi" ? "Hindi" : "English"}`}
      aria-busy={isPending}
    >
      {isPending ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <span
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current/18 text-[0.72rem] font-semibold leading-none"
          aria-hidden="true"
        >
          {iconLabel}
        </span>
      )}
      <span>{isPending ? "Wait..." : label}</span>
    </button>
  );
}
