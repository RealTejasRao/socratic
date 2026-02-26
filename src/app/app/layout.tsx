import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "src/server/db/client";
import { ROUTES } from "src/lib/routes";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import SidebarSessions from "./components/SidebarSessions";

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
    },
  });

  return (
    <div className="flex h-screen">
      <aside className="w-80 border-r border-gray-200 p-4 flex flex-col">
        <h2 className="text-lg font-semibold mb-4">Socratic</h2>

        <Link
          href={ROUTES.APP}
          className="mb-4 p-2 bg-black text-white rounded text-center"
        >
          + New Chat
        </Link>

        <div className="flex-1 overflow-y-auto">
          <SidebarSessions sessions={sessions} />
        </div>
      </aside>

      <div className="flex flex-col flex-1">
        <div className="flex justify-end items-center p-4 border-b border-gray-200">
          <UserButton afterSignOutUrl={ROUTES.HOME} />
        </div>

        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}





