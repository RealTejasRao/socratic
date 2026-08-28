import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { AppLayoutShell } from "@/src/app/app/layout";
import { ROUTES } from "@/src/lib/routes";
import { absoluteUrl } from "@/src/lib/seo";
import { getTodayUpscChallenge } from "./daily-challenges";
import UpscDailyChallengeModal from "./UpscDailyChallengeModal";
import UpscRouteSync from "./UpscRouteSync";

interface Props {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  title: {
    absolute: "Socratic AI | AI for UPSC Preparation",
  },
  description: "Private Socratic AI workspace for UPSC practice.",
  alternates: {
    canonical: absoluteUrl(ROUTES.UPSC_APP),
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      "max-snippet": 0,
      "max-image-preview": "none",
    },
  },
};

export default async function UpscAppLayout({ children }: Props) {
  const { userId: clerkUserId } = await auth();
  const dailyChallenge = await getTodayUpscChallenge();

  return (
    <AppLayoutShell
      appBasePath={ROUTES.UPSC_APP}
      marketingHomePath="/upsc"
      defaultNewChatMode="SOCRATIC"
      copy={{
        emptySessionTitle: "Start of a new practice session",
        newChatLabel: "New Practice",
        searchChatsLabel: "Search",
        roleplayModeLabel: "Ethics with Thinkers",
        chatsHeading: "Recent Practices",
      }}
    >
      <UpscRouteSync />
      <UpscDailyChallengeModal
        challenge={dailyChallenge}
        userStorageId={clerkUserId}
      />
      {children}
    </AppLayoutShell>
  );
}
