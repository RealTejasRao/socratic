"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { ArrowUpRight, UserRound } from "lucide-react";
import { ROUTES } from "@/src/lib/routes";

type MarketingNavAvatarProps = {
  className?: string;
};

export function MarketingNavAvatar({ className }: MarketingNavAvatarProps) {
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isOpen = isPinnedOpen || isHovering;

  useEffect(() => {
    if (!isPinnedOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsPinnedOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPinnedOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onEscape);

    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, [isPinnedOpen]);

  return (
    <div className={className}>
      <SignedIn>
        <div className="inline-flex items-center justify-center">
          <UserButton
            afterSignOutUrl={ROUTES.HOME}
            appearance={{
              elements: {
                userButtonAvatarBox:
                  "!h-8.5 !w-8.5 lg:!h-9.5 lg:!w-9.5 !border-0 !outline-none !ring-0 !shadow-none",
                userButtonTrigger:
                  "inline-flex !h-11 !w-11 items-center justify-center rounded-full transition-transform duration-250 hover:-translate-y-0.5 lg:!h-12 lg:!w-12 focus:!outline-none focus:!ring-0 focus-visible:!outline-none focus-visible:!ring-0",
              },
            }}
          />
        </div>
      </SignedIn>
      <SignedOut>
        <div
          ref={containerRef}
          className="relative inline-flex items-center justify-center"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <button
            type="button"
            aria-label="Open account options"
            aria-expanded={isOpen}
            aria-haspopup="menu"
            onClick={() => setIsPinnedOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/12 bg-white text-black/72 shadow-[0_6px_18px_rgba(0,0,0,0.08)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-black/24 hover:text-black/92 hover:shadow-[0_12px_26px_rgba(0,0,0,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/18 lg:h-12 lg:w-12"
          >
            <UserRound className="h-5.5 w-5.5 lg:h-6 lg:w-6" />
          </button>

          <div
            className={`absolute right-0 top-full z-50 pt-2.5 transition-all duration-220 ease-out ${isOpen ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-1 scale-[0.985] opacity-0"}`}
          >
            <div className="min-w-[11.25rem] rounded-2xl border border-black/12 bg-white/98 p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.14)] backdrop-blur-md">
              <Link
                href={ROUTES.SIGN_UP}
                role="menuitem"
                onClick={() => setIsPinnedOpen(false)}
                className="flex items-center justify-between rounded-xl bg-black px-3.5 py-2.5 text-[0.88rem] font-medium tracking-[0.01em] text-white transition-all duration-150 hover:bg-black/92 focus-visible:bg-black/92 focus-visible:outline-none"
              >
                Create account
                <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
              </Link>
              <Link
                href={ROUTES.SIGN_IN}
                role="menuitem"
                onClick={() => setIsPinnedOpen(false)}
                className="mt-1 flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[0.88rem] font-medium tracking-[0.01em] text-black/78 transition-all duration-150 hover:bg-black/[0.06] hover:text-black focus-visible:bg-black/[0.06] focus-visible:text-black focus-visible:outline-none"
              >
                Sign in
                <ArrowUpRight className="h-3.5 w-3.5 opacity-50" />
              </Link>
            </div>
          </div>
        </div>
      </SignedOut>
    </div>
  );
}
