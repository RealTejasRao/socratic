import { ReactNode } from "react";
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "src/server/db/client";
import { ensureUserForClerkId } from "src/server/auth/ensure-user";
import { ROUTES } from "src/lib/routes";
import { PLAN_LIMITS } from "src/lib/billing";
import { serializeSessionMeta } from "src/server/chat/session-meta";
import { absoluteUrl } from "src/lib/seo";
import {
  getUserBillingStateByUserId,
  getVisibleSessionsLimit,
} from "src/server/billing/access";
import AppSidebar from "./components/AppSidebar";
import AppTopBar from "./components/AppTopBar";

interface Props {
  children: ReactNode;
}

export const metadata: Metadata = {
  title: "Philosophy & Deep Conversations",
  description: "Private Socratic AI workspace for guided dialogue sessions.",
  alternates: {
    canonical: absoluteUrl("/app"),
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

export default async function AppLayout({ children }: Props) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect(ROUTES.SIGN_IN);
  }

  const dbUser = await ensureUserForClerkId(clerkUserId);
  const [billing, allVisibleSessions] = await Promise.all([
    getUserBillingStateByUserId(dbUser.id),
    prisma.chatSession.findMany({
      where: { userId: dbUser.id },
      orderBy: { lastActivityAt: "desc" },
      take: PLAN_LIMITS.PREMIUM_VISIBLE_SESSIONS,
      select: {
        id: true,
        title: true,
        mode: true,
        status: true,
        debateTone: true,
        debateDurationPreset: true,
        debateHasTimer: true,
        debateTopic: true,
        debateTopicSource: true,
        userDebateSide: true,
        aiDebateSide: true,
        debateStatus: true,
        debateStartedAt: true,
        debateEndedAt: true,
        debateWinner: true,
        roleplayMeta: true,
        lastActivityAt: true,
        messages: {
          orderBy: { createdAt: "asc" },
          take: 1,
          select: {
            content: true,
          },
        },
      },
    }),
  ]);
  const visibleSessionsLimit = getVisibleSessionsLimit({
    isPremium: billing?.isPremium ?? false,
  });
  const sessions = allVisibleSessions.slice(0, visibleSessionsLimit);

  const sidebarSessions = sessions.map(
    (session: (typeof sessions)[number]) => ({
      id: session.id,
      title: session.title,
      mode: session.mode,
      debate: serializeSessionMeta(session).debate ?? null,
      roleplay: serializeSessionMeta(session).roleplay ?? null,
      firstMessagePreview: session.messages[0]?.content ?? null,
    }),
  );

  return (
    <div className="app-layout h-svh bg-[#fefefc]">
      <div className="app-layout-inner flex h-full min-h-0 flex-col overflow-hidden bg-[#fefefc]">
        <div className="flex min-h-0 flex-1">
          <AppSidebar
            sessions={sidebarSessions}
            isPremium={billing?.isPremium ?? false}
          />

          <section className="app-chat-section relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#fefefc]">
            <AppTopBar
              sessions={sidebarSessions}
              isPremium={billing?.isPremium ?? false}
            />
            <main className="app-chat-main min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 pr-0 md:px-6 md:py-5 md:pr-0">
              {children}
            </main>
          </section>
        </div>
      </div>
    </div>
  );
}
