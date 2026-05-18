"use client";

import type { Route } from "next";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ROUTES } from "@/src/lib/routes";

type AuthAwareCtaLinkProps = {
  className?: string;
  signedOutHref?: Route;
  children: React.ReactNode;
  signedInChildren?: React.ReactNode;
  signedOutChildren?: React.ReactNode;
};

export function AuthAwareCtaLink({
  className,
  signedOutHref = ROUTES.SIGN_UP,
  children,
  signedInChildren,
  signedOutChildren,
}: AuthAwareCtaLinkProps) {
  const inContent = signedInChildren ?? children;
  const outContent = signedOutChildren ?? children;

  return (
    <>
      <SignedIn>
        <Link href={ROUTES.APP} className={className}>
          {inContent}
        </Link>
      </SignedIn>
      <SignedOut>
        <Link href={signedOutHref} className={className}>
          {outContent}
        </Link>
      </SignedOut>
    </>
  );
}
