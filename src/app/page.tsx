import type { Metadata } from "next";
import { LocalizedHomePage } from "@/src/components/home/localized-home-page";
import { createHomeMetadata } from "@/src/i18n/home-metadata";

export const metadata: Metadata = createHomeMetadata("en");

export default async function HomePage() {
  return <LocalizedHomePage locale="en" />;
}
