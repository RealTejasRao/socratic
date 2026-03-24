"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface Session {
  id: string;
  title: string | null;
}

interface Props {
  sessions: Session[];
}

export default function SidebarSessions({ sessions }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleDelete(id: string) {
    const confirmed = confirm("Delete this session?");
    if (!confirmed) return;

    await fetch(`/api/v1/chat/sessions/${id}`, {
      method: "DELETE",
    });

    if (pathname === `/app/${id}`) {
      router.push("/app");
      router.refresh();
    } else {
      router.refresh();
    }
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <div
          key={session.id}
          className={cn(
            "group flex items-center justify-between rounded-2xl border px-3 py-3 transition",
            pathname === `/app/${session.id}`
              ? "border-white/15 bg-white/12"
              : "border-white/0 bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.08]",
          )}
        >
          <Link href={`/app/${session.id}`} className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {session.title || "Untitled Session"}
            </p>
            <p className="mt-1 text-xs text-white/45">Continue the thread</p>
          </Link>

          <button
            onClick={() => handleDelete(session.id)}
            className="ml-3 rounded-full p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
            aria-label="Delete session"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      {sessions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/12 px-4 py-6 text-sm leading-6 text-white/55">
          Your conversation history will appear here once you start the first exchange.
        </div>
      )}
    </div>
  );
}
