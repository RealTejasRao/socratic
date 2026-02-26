"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

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
          className="flex items-center justify-between p-2 rounded hover:bg-gray-100"
        >
          <Link href={`/app/${session.id}`} className="flex-1">
            {session.title || "Untitled Session"}
          </Link>

          <button
            onClick={() => handleDelete(session.id)}
            className="text-red-500 hover:text-red-700 text-sm ml-2"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
