"use client";

import type { MouseEvent, ReactNode } from "react";
import { openCookieConsentPreferences } from "@/src/lib/cookie-consent";

type CookiePreferencesLinkProps = {
  children?: ReactNode;
  className?: string;
};

export function CookiePreferencesLink({
  children = "Consent Preferences",
  className,
}: CookiePreferencesLinkProps) {
  const combinedClassName = ["bg-transparent p-0 text-left", className]
    .filter(Boolean)
    .join(" ");

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    openCookieConsentPreferences();
  };

  return (
    <button type="button" className={combinedClassName} onClick={onClick}>
      {children}
    </button>
  );
}
