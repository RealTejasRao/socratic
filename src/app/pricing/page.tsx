import type { Metadata } from "next";
import { createPricingMetadata } from "@/src/i18n/pricing-metadata";
import { LocalizedPricingPage } from "./localized-pricing-page";

export const metadata: Metadata = createPricingMetadata("en");

export default async function PricingPage() {
  return <LocalizedPricingPage locale="en" />;
}
