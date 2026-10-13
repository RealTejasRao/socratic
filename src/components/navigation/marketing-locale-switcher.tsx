"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Globe2, LoaderCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  getLocalizedPath,
  type SupportedLocale,
} from "@/src/i18n/locales";

type MarketingLocaleSwitcherProps = {
  locale: SupportedLocale;
  label: string;
  path?: string;
  className?: string;
};

export function MarketingLocaleSwitcher({
  locale,
  label,
  path = "/",
  className = "",
}: MarketingLocaleSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingLocale, setPendingLocale] = useState<SupportedLocale | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const switcherRef = useRef<HTMLDivElement | null>(null);
  const isLoading = pendingLocale !== null || isPending;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!switcherRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!pendingLocale || pendingLocale !== locale) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPendingLocale(null);
    }, 220);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [locale, pendingLocale]);

  useEffect(() => {
    if (!pendingLocale) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPendingLocale(null);
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pendingLocale]);

  const changeLocale = (nextLocale: SupportedLocale) => {
    if (isLoading) {
      return;
    }

    if (nextLocale === locale) {
      setIsOpen(false);
      return;
    }

    // eslint-disable-next-line react-hooks/immutability -- intentional browser cookie write from a click handler.
    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const nextPath = `${getLocalizedPath(path, nextLocale)}${hash}` as Route;

    setPendingLocale(nextLocale);
    setIsOpen(false);
    startTransition(() => {
      router.push(nextPath);
      if (pathname === nextPath) {
        router.refresh();
      }
    });
  };

  return (
    <div ref={switcherRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (!isLoading) {
            setIsOpen((current) => !current);
          }
        }}
        disabled={isLoading}
        className={`${className} ${
          isLoading ? "cursor-not-allowed opacity-85" : ""
        }`}
        aria-label={label}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-busy={isLoading}
      >
        {isLoading ? (
          <LoaderCircle className="h-3.75 w-3.75 animate-spin" aria-hidden="true" />
        ) : (
          <Globe2 className="h-3.75 w-3.75" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">
          {LOCALE_LABELS[pendingLocale ?? locale]}
        </span>
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-[calc(100%+0.55rem)] z-70 min-w-42 origin-top-right rounded-[12px] border border-black/10 bg-white p-1.5 shadow-[0_18px_44px_rgba(0,0,0,0.15)]"
          >
            {SUPPORTED_LOCALES.map((option) => {
              const isActive = option === locale;
              const isOptionLoading = pendingLocale === option;

              return (
                <button
                  key={option}
                  type="button"
                  role="menuitem"
                  onClick={() => changeLocale(option)}
                  disabled={isLoading}
                  className={`flex w-full items-center justify-between gap-3 rounded-[9px] px-3 py-2 text-left text-[0.8rem] transition-colors ${
                    isActive
                      ? "bg-black text-white"
                      : "text-black/72 hover:bg-black/5 hover:text-black"
                  } ${
                    isLoading
                      ? "cursor-not-allowed opacity-70"
                      : "cursor-pointer"
                  }`}
                >
                  <span>{LOCALE_LABELS[option]}</span>
                  {isOptionLoading ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : isActive ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : null}
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {isLoading && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[2147483647] cursor-not-allowed"
              aria-hidden="true"
            />,
            document.body,
          )
        : null}
    </div>
  );
}
