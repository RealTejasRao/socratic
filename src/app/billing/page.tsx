import type { Metadata } from "next";
import { getBillingCopy } from "@/src/i18n/billing";
import { createPageMetadata } from "@/src/lib/seo";
import { LocalizedBillingPage, type BillingPageSearchParams } from "./localized-billing-page";

export const metadata: Metadata = createPageMetadata({
  title: getBillingCopy("en").metadata.title,
  description: getBillingCopy("en").metadata.description,
  path: "/billing",
});

type BillingPageProps = {
  searchParams?: BillingPageSearchParams;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  return <LocalizedBillingPage locale="en" searchParams={searchParams} />;
}
