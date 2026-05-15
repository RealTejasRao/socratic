import Script from "next/script";

const TERMLY_WEBSITE_UUID =
  process.env["NEXT_PUBLIC_TERMLY_WEBSITE_UUID"] ??
  "2968bb44-22b4-41e1-9eef-8f6436f7b802";

export function TermlyConsent() {
  if (!TERMLY_WEBSITE_UUID) {
    return null;
  }

  return (
    <Script
      id="termly-embed"
      src="https://app.termly.io/embed.min.js"
      strategy="afterInteractive"
      data-auto-block="on"
      data-website-uuid={TERMLY_WEBSITE_UUID}
    />
  );
}
