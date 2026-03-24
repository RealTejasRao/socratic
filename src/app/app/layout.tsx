import { ReactNode } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { ROUTES } from "src/lib/routes";
import { prisma } from "src/server/db/client";
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
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(99,204,202,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(57,115,103,0.16),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(246,250,249,0.94))] text-foreground md:flex-row dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,204,202,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(66,133,140,0.16),_transparent_26%),linear-gradient(180deg,_rgba(8,12,13,0.98),_rgba(11,17,18,0.98))]">
      <aside className="relative z-10 flex w-full shrink-0 flex-col border-b border-white/40 bg-[linear-gradient(180deg,rgba(14,23,24,0.94),rgba(20,34,35,0.92))] px-4 py-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.22)] md:h-svh md:w-80 md:border-b-0 md:border-r md:border-white/10 md:px-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.32em] text-white/45">
              Socratic
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Quiet room for better questions
            </h1>
            <p className="mt-2 max-w-xs text-sm leading-6 text-white/62">
              Your conversations stay organized here, ready to reopen and push further.
            </p>
          </div>
          <div className="pt-1 md:hidden">
            <UserButton afterSignOutUrl={ROUTES.HOME} />
          </div>
        </div>

        <Button
          asChild
          className="mb-4 h-11 rounded-2xl bg-white text-slate-900 shadow-none hover:bg-white/90"
        >
          <Link href={ROUTES.APP}>New Chat</Link>
        </Button>

        <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-white/45">
          <span>Recent Sessions</span>
          <span>{sessions.length}</span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarSessions sessions={sessions} />
        </div>
      </aside>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border/60 bg-background/58 px-4 py-4 backdrop-blur-xl md:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
              Workspace
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              Socratic Dialogue
            </h2>
          </div>
          <div className="hidden md:block">
            <UserButton afterSignOutUrl={ROUTES.HOME} />
          </div>
        </div>

        <main className="min-h-0 flex-1 p-3 md:p-6">{children}</main>
      </div>
    </div>
  );
}
