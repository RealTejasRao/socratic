import type { Metadata } from "next";
import { createBillingMetadata } from "@/src/i18n/billing-metadata";
import { LocalizedBillingPage, type BillingPageSearchParams } from "./localized-billing-page";

export const metadata: Metadata = createBillingMetadata("en");

type BillingPageProps = {
  searchParams?: BillingPageSearchParams;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  return <LocalizedBillingPage locale="en" searchParams={searchParams} />;
}
