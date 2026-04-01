import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "src/server/db/client";
import { ROUTES } from "src/lib/routes";
import AppSidebar from "./components/AppSidebar";
import AppTopBar from "./components/AppTopBar";

interface Props {
  children: ReactNode;
}

export default async function AppLayout({ children }: Props) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect(ROUTES.SIGN_IN);
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true },
  });

  if (!dbUser) {
    redirect(ROUTES.SIGN_IN);
  }

  const sessions = await prisma.chatSession.findMany({
    where: { userId: dbUser.id },
    orderBy: { lastActivityAt: "desc" },
    select: {
      id: true,
      title: true,
      lastActivityAt: true,
      messages: {
        where: { role: "USER" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: {
          content: true,
        },
      },
    },
  });

  const sidebarSessions = sessions.map((session) => ({
    id: session.id,
    title: session.title,
    firstMessagePreview: session.messages[0]?.content ?? null,
  }));

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
