import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "src/server/db/client";
import { ROUTES } from "src/lib/routes";
import AppSidebar from "./components/AppSidebar";

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
    <div className="h-svh bg-[#e9ecf4]">
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f5f9]">
        <div className="flex min-h-0 flex-1">
          <AppSidebar sessions={sessions} />

          <section className="flex min-h-0 flex-1 flex-col bg-[#f7f8fb]">
            <main className="min-h-0 flex-1 p-2.5 md:p-4">{children}</main>
          </section>
        </div>
      </div>
    </div>
  );
}
