"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    Termly?: {
      initialize?: () => void;
    };
  }
}

const TERMLY_WEBSITE_UUID =
  process.env["NEXT_PUBLIC_TERMLY_WEBSITE_UUID"] ??
  "2968bb44-22b4-41e1-9eef-8f6436f7b802";

const TERMLY_AUTO_BLOCK =
  (process.env["NEXT_PUBLIC_TERMLY_AUTO_BLOCK"] ?? "off").toLowerCase() === "on";

const TERMLY_MASTER_CONSENTS_ORIGIN =
  process.env["NEXT_PUBLIC_TERMLY_MASTER_CONSENTS_ORIGIN"] ?? "";

function buildTermlyScriptSrc() {
  const src = new URL("https://app.termly.io");
  src.pathname = `/resource-blocker/${TERMLY_WEBSITE_UUID}`;
  src.searchParams.set("autoBlock", TERMLY_AUTO_BLOCK ? "on" : "off");

  if (TERMLY_MASTER_CONSENTS_ORIGIN) {
    src.searchParams.set("masterConsentsOrigin", TERMLY_MASTER_CONSENTS_ORIGIN);
  }

  return src.toString();
}

export function TermlyConsent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isScriptAdded = useRef(false);
  const scriptSrc = useMemo(buildTermlyScriptSrc, []);

  useEffect(() => {
    if (isScriptAdded.current || typeof window === "undefined") {
      return;
    }

    const existingScript = document.querySelector(
      `script[src="${scriptSrc}"]`,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      isScriptAdded.current = true;
      return;
    }

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = scriptSrc;
    script.id = "termly-cmp-script";
    document.head.appendChild(script);
    isScriptAdded.current = true;
  }, [scriptSrc]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.Termly?.initialize?.();
    } catch {}
  }, [pathname, searchParams]);

  if (!TERMLY_WEBSITE_UUID) {
    return null;
  }

  return null;
}
