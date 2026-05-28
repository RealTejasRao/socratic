"use client";

import {
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Check,
  CircleCheck,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  ScrollText,
  Swords,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { DebateSessionState, RoleplaySessionState } from "src/types/chat";

interface Session {
  id: string;
  title: string | null;
  mode: "SOCRATIC" | "DEBATE" | "ROLEPLAY";
  debate: DebateSessionState | null;
  roleplay: RoleplaySessionState | null;
  firstMessagePreview: string | null;
}

interface Props {
  sessions: Session[];
  showHoverPreviews?: boolean;
  showModeBadges?: boolean;
}

type SessionActionDialog =
  | {
      mode: "rename";
      sessionId: string;
      currentTitle: string;
    }
  | {
      mode: "delete";
      sessionId: string;
      currentTitle: string;
    };

type SuccessToastState = {
  message: string;
  isLeaving: boolean;
} | null;

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function SidebarSessions({
  sessions,
  showHoverPreviews = true,
  showModeBadges = true,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [hoveredSession, setHoveredSession] = useState<{
    id: string;
    preview: string;
    x: number;
    y: number;
  } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openMenuDirection, setOpenMenuDirection] = useState<"up" | "down">(
    "down",
  );
  const [actionDialog, setActionDialog] = useState<SessionActionDialog | null>(
    null,
  );
  const [renameValue, setRenameValue] = useState("");
  const [successToast, setSuccessToast] = useState<SuccessToastState>(null);
  const [pendingAction, setPendingAction] = useState<
    "rename" | "delete" | null
  >(null);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [displaySessions, setDisplaySessions] = useState(sessions);

  useEffect(() => {
    setDisplaySessions(sessions);
  }, [sessions]);

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

  useEffect(() => {
    if (!actionDialog) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pendingAction) {
        setActionDialog(null);
        setRenameValue("");
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [actionDialog, pendingAction]);

  useEffect(() => {
    setPendingSessionId(null);
  }, [pathname]);

  useEffect(() => {
    if (!pendingSessionId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPendingSessionId(null);
    }, 7000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pendingSessionId]);

  useEffect(() => {
    if (!successToast) {
      return;
    }

    if (successToast.isLeaving) {
      const timeoutId = window.setTimeout(() => {
        setSuccessToast(null);
      }, 240);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessToast((current) =>
        current
          ? {
              ...current,
              isLeaving: true,
            }
          : null,
      );
    }, 1900);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [successToast]);

  function showSuccessToast(message: string) {
    setSuccessToast({
      message,
      isLeaving: false,
    });
  }

  function startRename(session: Session) {
    setOpenMenuId(null);
    setHoveredSession(null);
    setActionDialog({
      mode: "rename",
      sessionId: session.id,
      currentTitle: session.title || "Untitled Session",
    });
    setRenameValue(session.title || "");
  }

  function closeActionDialog() {
    if (pendingAction) {
      return;
    }

    setActionDialog(null);
    setRenameValue("");
  }

  async function handleRenameSubmit(id: string) {
    const title = renameValue.trim();
    if (!title || pendingAction) return;

    const previousSessions = displaySessions;
    setPendingAction("rename");

    try {
      await wait(1000);
      setDisplaySessions((current) =>
        current.map((session) =>
          session.id === id ? { ...session, title } : session,
        ),
      );
      setActionDialog(null);
      setRenameValue("");
      showSuccessToast("Renamed successfully");

      const res = await fetch(`/api/v1/chat/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        setDisplaySessions(previousSessions);
        return;
      }

      router.refresh();
    } catch {
      setDisplaySessions(previousSessions);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete(id: string) {
    if (pendingAction) return;

    const previousSessions = displaySessions;
    setPendingAction("delete");

    try {
      await wait(1000);
      setDisplaySessions((current) =>
        current.filter((session) => session.id !== id),
      );
      setActionDialog(null);
      setRenameValue("");
      showSuccessToast("Deleted successfully");

      const res = await fetch(`/api/v1/chat/sessions/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setDisplaySessions(previousSessions);
        return;
      }

      if (pathname === `/app/${id}`) {
        router.push("/app");
        router.refresh();
      } else {
        router.refresh();
      }
    } catch {
      setDisplaySessions(previousSessions);
    } finally {
      setPendingAction(null);
    }
  }

  const isDialogBusy = pendingAction !== null;

  function renderPendingLabel(label: string) {
    return (
      <>
        <LoaderCircle size={12} className="animate-spin" />
        {label}
      </>
    );
  }

  function getMenuDirection(triggerElement: HTMLElement): "up" | "down" {
    const preferredMenuHeight = 92;
    const container = triggerElement.closest(".sidebar-scroll") as
      | HTMLElement
      | null;
    const triggerRect = triggerElement.getBoundingClientRect();

    if (container) {
      const containerRect = container.getBoundingClientRect();
      const spaceBelow = containerRect.bottom - triggerRect.bottom;
      const spaceAbove = triggerRect.top - containerRect.top;

      if (
        spaceBelow >= preferredMenuHeight ||
        spaceBelow >= spaceAbove
      ) {
        return "down";
      }

      return "up";
    }

    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    if (spaceBelow >= preferredMenuHeight || spaceBelow >= spaceAbove) {
      return "down";
    }

    return "up";
  }

  function handleSessionOpen(
    event: ReactMouseEvent<HTMLAnchorElement>,
    id: string,
  ) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    if (pathname === `/app/${id}`) {
      setPendingSessionId(null);
      return;
    }

    setPendingSessionId(id);
    setOpenMenuId(null);
    setHoveredSession(null);
  }

  return (
    <div className="space-y-1 lg:space-y-1">
      {successToast && (
        <div className="pointer-events-none fixed right-4 top-4 z-70">
          <div
            className={cn(
              "app-session-success-toast flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/96 px-3 py-2 text-[11px] text-emerald-800 shadow-[0_14px_34px_rgba(16,185,129,0.14)] backdrop-blur-sm",
              successToast.isLeaving
                ? "animate-[toastSlideOut_240ms_cubic-bezier(0.4,0,0.2,1)_both]"
                : "animate-[toastSlideIn_220ms_cubic-bezier(0.22,1,0.36,1)_both]",
            )}
          >
            <CircleCheck
              size={14}
              className="app-session-success-toast-icon text-emerald-600"
            />
            <span className="app-session-success-toast-text">
              {successToast.message}
            </span>
          </div>
        </div>
      )}

      {displaySessions.map((session) => {
        const isActive = pathname === `/app/${session.id}`;
        const isOpening = pendingSessionId === session.id && !isActive;
        const hoverPreview =
          session.firstMessagePreview?.trim() ||
          session.title ||
          "Untitled Session";

        return (
          <div
            key={session.id}
            className={cn(
              "app-session-row group flex items-center justify-between rounded-[14px] px-1.5 py-1 transition-[background-color,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] lg:px-1.5 lg:py-1",
              isActive && "app-session-row-active",
              isOpening && "app-session-row-loading",
              isActive
                ? session.mode === "DEBATE"
                  ? "bg-slate-100 text-slate-900 lg:bg-slate-100"
                  : "bg-slate-100 text-slate-900 lg:bg-slate-100"
                : isOpening
                  ? "text-slate-600"
                  : "text-slate-600",
            )}
            onMouseEnter={(event) => {
              if (!showHoverPreviews) return;

              if (
                isOpening ||
                openMenuId === session.id ||
                actionDialog?.sessionId === session.id
              )
                return;

              const rect = event.currentTarget.getBoundingClientRect();
              setHoveredSession({
                id: session.id,
                preview: hoverPreview,
                x: rect.right + 14,
                y: rect.top + rect.height / 2,
              });
            }}
            onMouseLeave={() => {
              setHoveredSession((current) =>
                current?.id === session.id ? null : current,
              );
            }}
          >
            <>
              <Link
                href={`/app/${session.id}`}
                className="block min-w-0 flex-1"
                onClick={(event) => handleSessionOpen(event, session.id)}
              >
                <div className="flex min-w-0 items-center gap-2 lg:gap-2">
                  {session.mode !== "SOCRATIC" && (
                    showModeBadges && (
                      <span
                        className={cn(
                          "app-session-mode-icon hidden h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--app-light-button-primary-bg)] bg-[var(--app-light-button-primary-bg)] text-[var(--app-light-button-primary-text)] transition-[background-color,border-color,color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] lg:inline-flex lg:h-6 lg:w-6",
                        )}
                      >
                        {session.mode === "DEBATE" ? (
                          <Swords size={13} />
                        ) : (
                          <ScrollText size={13} />
                        )}
                      </span>
                    )
                  )}
                  <p className="truncate text-[14px] leading-5 lg:text-[14px] lg:leading-5">
                    {session.title || "Untitled Session"}
                  </p>
                  {showModeBadges && session.mode !== "SOCRATIC" && !isActive && (
                    <span className="hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-500 transition-[background-color,border-color,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] lg:inline-flex">
                      {session.mode === "DEBATE" ? "Debate" : "Roleplay"}
                    </span>
                  )}
                </div>
              </Link>
              {isOpening ? (
                <div className="app-session-opening-chip ml-1.5 inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/90 px-2 py-1 text-[11px] text-slate-600 shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
                  <LoaderCircle size={11} className="animate-spin" />
                  <span className="font-medium">Opening</span>
                </div>
              ) : (
                <div
                  className="relative ml-1.5"
                  ref={openMenuId === session.id ? menuRef : null}
                >
                  <button
                    type="button"
                    onClick={(event) => {
                      const triggerElement = event.currentTarget;

                      setOpenMenuId((current) => {
                        if (current === session.id) {
                          return null;
                        }

                        setOpenMenuDirection(getMenuDirection(triggerElement));
                        return session.id;
                      });
                    }}
                    className="app-session-menu-trigger cursor-pointer rounded-md p-1.5 text-slate-400 opacity-100 transition-[opacity,background-color,color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02] lg:p-2 lg:opacity-0 lg:group-hover:opacity-100"
                    aria-label="Open chat actions"
                  >
                    <MoreHorizontal size={16} className="lg:h-4.25 lg:w-4.25" />
                  </button>

                  {openMenuId === session.id && (
                    <div
                      className={cn(
                        "app-card absolute right-0 z-120 w-31 rounded-[9px] bg-white p-1.5 shadow-[0_0_0_0.5px_#C9C9C3,0_8px_18px_rgba(26,26,26,0.06)] animate-[dropdownSlideIn_180ms_cubic-bezier(0.22,1,0.36,1)_both]",
                        openMenuDirection === "up"
                          ? "bottom-full mb-1.5 origin-bottom-right"
                          : "top-full mt-1.5 origin-top-right",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => startRename(session)}
                        className="flex w-full cursor-pointer items-center gap-2 rounded-[14px] px-2 py-1.5 text-left text-[14px] text-[#1A1A1A] transition hover:bg-[#F6F6F3]"
                      >
                        <Pencil size={15} />
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          setHoveredSession(null);
                          setActionDialog({
                            mode: "delete",
                            sessionId: session.id,
                            currentTitle: session.title || "Untitled Session",
                          });
                        }}
                        className="flex w-full cursor-pointer items-center gap-2 rounded-[14px] px-2 py-1.5 text-left text-[14px] text-[#EF4444] transition hover:bg-rose-50"
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          </div>
        );
      })}

      {displaySessions.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white/50 px-3 py-3 text-[12px] text-slate-500 lg:py-2.5 lg:text-[10px]">
          Chats will appear here.
        </div>
      )}

      {showHoverPreviews && hoveredSession && (
        <div
          className="pointer-events-none fixed z-50 w-64 -translate-y-1/2"
          style={{ left: hoveredSession.x, top: hoveredSession.y }}
        >
          <div className="app-card app-session-preview-card relative rounded-xl border px-3 py-2.5 text-[12px] leading-5 shadow-[0_16px_36px_rgba(15,23,42,0.16)] backdrop-blur-sm">
            <div className="app-session-preview-arrow absolute top-1/2 -left-1.5 h-2.5 w-2.5 -translate-y-1/2 rotate-45 border-b border-l" />
            <p className="app-session-preview-text line-clamp-6 whitespace-pre-wrap wrap-break-word">
              {hoveredSession.preview}
            </p>
          </div>
        </div>
      )}

      {actionDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/16 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label={
            actionDialog.mode === "rename" ? "Rename chat" : "Delete chat"
          }
          onClick={() => {
            if (!isDialogBusy) {
              closeActionDialog();
            }
          }}
        >
          <div
            className="app-card app-session-dialog w-full max-w-95 rounded-2xl border border-[#C8C8C2] bg-white px-5 py-4.5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[20px] leading-none tracking-[-0.04em] text-slate-900 font-[Georgia,serif]">
                  {actionDialog.mode === "rename"
                    ? "Rename chat"
                    : "Delete chat"}
                </p>
                <p className="mt-1.5 text-[12px] leading-5 text-slate-500">
                  {actionDialog.mode === "rename"
                    ? "Give this chat a cleaner title."
                    : "This removes the chat permanently."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeActionDialog}
                disabled={isDialogBusy}
                className="cursor-pointer rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Close dialog"
              >
                <X size={12} />
              </button>
            </div>

            {actionDialog.mode === "rename" ? (
              <>
                <input
                  value={renameValue}
                  onChange={(event) => setRenameValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleRenameSubmit(actionDialog.sessionId);
                    }
                  }}
                  disabled={isDialogBusy}
                  maxLength={80}
                  autoFocus
                  className="app-session-dialog-input h-10 w-full rounded-[14px] border border-slate-300 bg-white px-3 text-[13px] text-slate-800 outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeActionDialog}
                    disabled={isDialogBusy}
                    className="app-session-dialog-cancel cursor-pointer rounded-[14px] border border-slate-300 px-3 py-2 text-[13px] text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void handleRenameSubmit(actionDialog.sessionId)
                    }
                    disabled={isDialogBusy || !renameValue.trim()}
                    className="app-session-dialog-save inline-flex cursor-pointer items-center gap-1.5 rounded-[14px] bg-slate-900 px-3 py-2 text-[13px] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pendingAction === "rename" ? (
                      renderPendingLabel("Saving...")
                    ) : (
                      <>
                        <Check size={12} />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="app-session-dialog-danger-box rounded-[14px] bg-slate-50 px-3 py-2 text-[12px] leading-5 text-slate-600">
                  {actionDialog.currentTitle}
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeActionDialog}
                    disabled={isDialogBusy}
                    className="app-session-dialog-cancel cursor-pointer rounded-[14px] border border-slate-300 px-3 py-2 text-[13px] text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(actionDialog.sessionId)}
                    disabled={isDialogBusy}
                    className="app-session-dialog-delete inline-flex cursor-pointer items-center gap-1.5 rounded-[14px] bg-rose-600 px-3 py-2 text-[13px] text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pendingAction === "delete" ? (
                      renderPendingLabel("Deleting...")
                    ) : (
                      <>
                        <Trash2 size={12} />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
