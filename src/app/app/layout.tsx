import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "src/server/db/client";
import { ROUTES } from "src/lib/routes";
import { serializeSessionMeta } from "src/server/chat/session-meta";
import AppSidebar from "./components/AppSidebar";
import AppTopBar from "./components/AppTopBar";

interface Props {
  children: ReactNode;
}

export default async function AppLayout({ children }: Props) {
  const { userId: clerkUserId } = await auth();

  console.log("CLERK USER ID:", clerkUserId);

  const allowedEmails = (process.env["APP_ALLOWED_EMAILS"] ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

    console.log("ALLOWED EMAILS:", allowedEmails);

  if (!clerkUserId) {
    console.log("❌ No clerk user ID — redirecting");
    redirect(ROUTES.SIGN_IN);
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true, email: true },
  });

  if (!dbUser) {
    console.log("❌ No DB user found — redirecting");
    redirect(ROUTES.HOME);
  }

  const normalizedDbEmail = dbUser.email?.trim().toLowerCase() ?? "";

  console.log("DB EMAIL:", normalizedDbEmail);

  if (
    allowedEmails.length === 0 ||
    !normalizedDbEmail ||
    !allowedEmails.includes(normalizedDbEmail)
  ) {
    console.log("❌ Email not allowed — redirecting");
    redirect(ROUTES.HOME);
  }

  console.log("✅ Access granted");
  
  const sessions = await prisma.chatSession.findMany({
    where: { userId: dbUser.id },
    orderBy: { lastActivityAt: "desc" },
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
    },
  });

  const sidebarSessions = sessions.map(
    (session: (typeof sessions)[number]) => ({
      id: session.id,
      title: session.title,
      mode: session.mode,
      debate: serializeSessionMeta(session).debate ?? null,
      roleplay: serializeSessionMeta(session).roleplay ?? null,
      firstMessagePreview: null,
    }),
  );

  return (
    <div className="app-layout h-svh bg-white">
      <div className="app-layout-inner flex h-full min-h-0 flex-col overflow-hidden bg-white">
        <div className="flex min-h-0 flex-1">
          <AppSidebar sessions={sidebarSessions} />

          <section className="app-chat-section relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
            <AppTopBar sessions={sidebarSessions} />
            <main className="app-chat-main min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 pr-0 md:px-6 md:py-5 md:pr-0">
              {children}
            </main>
          </section>
        </div>
      </div>
    </div>
  );
}
