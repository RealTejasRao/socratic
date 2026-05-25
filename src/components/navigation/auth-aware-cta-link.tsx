"use client";

import { useEffect, useState, type MouseEvent } from "react";
import type { Route } from "next";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { LoaderCircle } from "lucide-react";
import { ROUTES } from "@/src/lib/routes";
import { RoseCurveLoader } from "@/src/components/ui/rose-curve-loader";

type AuthAwareCtaLinkProps = {
  className?: string;
  signedOutHref?: Route;
  children: React.ReactNode;
  signedInChildren?: React.ReactNode;
  signedOutChildren?: React.ReactNode;
  showPendingStateOnNavigate?: boolean;
  pendingIndicator?: "spinner" | "roseCurve";
};

export function AuthAwareCtaLink({
  className,
  signedOutHref = ROUTES.SIGN_UP,
  children,
  signedInChildren,
  signedOutChildren,
  showPendingStateOnNavigate = false,
  pendingIndicator = "spinner",
}: AuthAwareCtaLinkProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const inContent = signedInChildren ?? children;
  const outContent = signedOutChildren ?? children;

  useEffect(() => {
    if (!isNavigating) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsNavigating(false);
    }, 12000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isNavigating]);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!showPendingStateOnNavigate || isNavigating || event.defaultPrevented) {
      return;
    }

    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    setIsNavigating(true);
  }

  const resolvedClassName =
    showPendingStateOnNavigate && isNavigating
      ? `${className ?? ""} pointer-events-none opacity-90`.trim()
      : className;

  function withPendingSpinner(content: React.ReactNode) {
    if (!showPendingStateOnNavigate || !isNavigating) {
      return content;
    }

    return (
      <span className="inline-flex items-center gap-1.5">
        {content}
        {pendingIndicator === "roseCurve" ? (
          <RoseCurveLoader />
        ) : (
          <LoaderCircle
            aria-hidden="true"
            className="h-[0.95em] w-[0.95em] animate-spin"
            strokeWidth={2.3}
          />
        )}
      </span>
    );
  }

  return (
    <>
      <SignedIn>
        <Link
          href={ROUTES.APP}
          className={resolvedClassName}
          onClick={handleClick}
          aria-busy={showPendingStateOnNavigate ? isNavigating : undefined}
        >
          {withPendingSpinner(inContent)}
        </Link>
      </SignedIn>
      <SignedOut>
        <Link
          href={signedOutHref}
          className={resolvedClassName}
          onClick={handleClick}
          aria-busy={showPendingStateOnNavigate ? isNavigating : undefined}
        >
          {withPendingSpinner(outContent)}
        </Link>
      </SignedOut>
    </>
  );
}
