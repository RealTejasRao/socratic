"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
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
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [hoveredSession, setHoveredSession] = useState<{
    title: string;
    x: number;
    y: number;
  } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  function startRename(session: Session) {
    setOpenMenuId(null);
    setHoveredSession(null);
    setRenamingId(session.id);
    setRenameValue(session.title || "");
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameValue("");
  }

  async function handleRenameSubmit(id: string) {
    const title = renameValue.trim();
    if (!title) return;

    const res = await fetch(`/api/v1/chat/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    if (!res.ok) return;

    setRenamingId(null);
    setRenameValue("");
    router.refresh();
  }

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
    <div className="space-y-1">
      {sessions.map((session) => {
        const isActive = pathname === `/app/${session.id}`;

        return (
          <div
            key={session.id}
            className={cn(
              "group flex items-center justify-between rounded-lg px-2 py-1.5",
              isActive ? "bg-white text-slate-900" : "text-slate-600 hover:bg-white/70",
            )}
            onMouseEnter={(event) => {
              if (!session.title || openMenuId === session.id || renamingId === session.id) return;

              const rect = event.currentTarget.getBoundingClientRect();
              setHoveredSession({
                title: session.title,
                x: rect.right + 14,
                y: rect.top + rect.height / 2,
              });
            }}
            onMouseLeave={() => {
              setHoveredSession((current) =>
                current?.title === session.title ? null : current,
              );
            }}
          >
            {renamingId === session.id ? (
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <input
                  value={renameValue}
                  onChange={(event) => setRenameValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleRenameSubmit(session.id);
                    }

                    if (event.key === "Escape") {
                      cancelRename();
                    }
                  }}
                  maxLength={80}
                  autoFocus
                  className="h-8 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800 outline-none focus:border-slate-400"
                />
                <button
                  type="button"
                  onClick={() => void handleRenameSubmit(session.id)}
                  className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Save name"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  onClick={cancelRename}
                  className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Cancel rename"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <Link href={`/app/${session.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm">{session.title || "Untitled Session"}</p>
                </Link>
                <div className="relative ml-2" ref={openMenuId === session.id ? menuRef : null}>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuId((current) => (current === session.id ? null : session.id))
                    }
                    className="rounded-md p-1 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Open chat actions"
                  >
                    <MoreHorizontal size={14} />
                  </button>

                  {openMenuId === session.id && (
                    <div className="absolute top-full right-0 z-40 mt-1.5 w-32 rounded-lg border border-slate-200 bg-white p-1 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
                      <button
                        type="button"
                        onClick={() => startRename(session)}
                        className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Pencil size={13} />
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(session.id)}
                        className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-rose-600 transition hover:bg-rose-50"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}

      {sessions.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white/50 px-3 py-3 text-xs text-slate-500">
          Chats will appear here.
        </div>
      )}

      {hoveredSession && (
        <div
          className="pointer-events-none fixed z-50 w-72 -translate-y-1/2"
          style={{ left: hoveredSession.x, top: hoveredSession.y }}
        >
          <div className="relative rounded-xl border border-slate-200/90 bg-white/96 px-3 py-2.5 text-xs leading-5 text-slate-700 shadow-[0_16px_36px_rgba(15,23,42,0.16)] backdrop-blur-sm">
            <div className="absolute top-1/2 -left-1.5 h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l border-slate-200/90 bg-white/96" />
            <p className="line-clamp-6">{hoveredSession.title}</p>
          </div>
        </div>
      )}
    </div>
  );
}
