import type { Metadata } from "next";
import { SettingsAppClient } from "./settings-app-client";
import { createPageMetadata } from "@/src/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Settings",
  description: "Manage your Socratic AI app settings.",
  path: "/settings-app",
  index: false,
});

export default function SettingsAppPage() {
  return <SettingsAppClient />;
}
