"use client";

import type { MouseEvent, ReactNode } from "react";

declare global {
  interface Window {
    displayPreferenceModal?: () => void;
  }
}

const TERMLY_FALLBACK_TRIGGER_ID = "termly-pref-trigger";

function openTermlyPreferences(event?: MouseEvent<HTMLElement>) {
  event?.preventDefault();

  if (typeof window === "undefined") {
    return;
  }

  if (typeof window.displayPreferenceModal === "function") {
    window.displayPreferenceModal();
    return;
  }

  const fallbackTrigger = document.getElementById(
    TERMLY_FALLBACK_TRIGGER_ID,
  ) as HTMLButtonElement | null;

  fallbackTrigger?.click();
}

type TermlyPreferencesLinkProps = {
  children?: ReactNode;
  className?: string;
};

export function TermlyPreferencesLink({
  children = "Consent Preferences",
  className,
}: TermlyPreferencesLinkProps) {
  const combinedClassName = ["termly-display-preferences", className]
    .filter(Boolean)
    .join(" ");

  return (
    <a href="#" className={combinedClassName} onClick={openTermlyPreferences}>
      {children}
    </a>
  );
}
