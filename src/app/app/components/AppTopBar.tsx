"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Inter } from "next/font/google";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Clock3,
  Copy,
  LoaderCircle,
  Moon,
  PanelLeftOpen,
  Pencil,
  ScrollText,
  Send,
  Swords,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { PremiumCrownIcon } from "@/src/components/billingsdk/premium-crown-icon";
import { useStandaloneMode } from "@/src/hooks/use-standalone-mode";
import { formatDebateCountdown, getDebateDurationMeta } from "src/lib/debate";
import { ROUTES } from "src/lib/routes";
import type { DebateSessionState, RoleplaySessionState } from "src/types/chat";
import AppUserButton from "./AppUserButton";
import { useAppRoute } from "./app-route-context";

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
  isPremium?: boolean;
}

type ActionDialog =
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

type AppTheme = "light" | "dark";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default function AppTopBar({ sessions, isPremium = false }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { appBasePath, matchSessionPath, isSessionPath, copy } = useAppRoute();
  const isStandalone = useStandaloneMode();
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [actionDialog, setActionDialog] = useState<ActionDialog | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [pendingAction, setPendingAction] = useState<
    "rename" | "delete" | null
  >(null);
  const [shareUrl, setShareUrl] = useState("");
  const [shareTitle, setShareTitle] = useState("");
  const [isPreparingShare, setIsPreparingShare] = useState(false);
  const [shareError, setShareError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isThemeReady, setIsThemeReady] = useState(false);
  const [isEndingDebate, setIsEndingDebate] = useState(false);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const finalizeRequestedRef = useRef(false);

  const activeSession = useMemo(() => {
    const matched = matchSessionPath(pathname);
    const sessionId = matched?.[1];

    if (!sessionId) {
      return null;
    }

    return sessions.find((session) => session.id === sessionId) ?? null;
  }, [matchSessionPath, pathname, sessions]);

  const title = activeSession?.title || copy.emptySessionTitle;
  const isDialogBusy = pendingAction !== null;
  const activeDebate = activeSession?.debate ?? null;
  const debateDurationMeta = activeDebate
    ? getDebateDurationMeta(activeDebate.durationPreset)
    : null;
  const remainingSeconds =
    activeDebate?.hasTimer &&
    activeDebate.startedAt &&
    debateDurationMeta?.minutes &&
    nowMs !== null
      ? Math.max(
          0,
          Math.ceil(
            (new Date(activeDebate.startedAt).getTime() +
              debateDurationMeta.minutes * 60 * 1000 -
              nowMs) /
              1000,
          ),
        )
      : null;
  const encodedShareUrl = shareUrl ? encodeURIComponent(shareUrl) : "";
  const encodedShareText = encodeURIComponent(
    shareTitle
      ? `Check out this Socratic AI chat: ${shareTitle}`
      : "Check out this Socratic AI chat",
  );
  const billingCtaHref = isPremium ? ROUTES.APP_BILLING : ROUTES.PRICING;
  const billingCtaTarget = isStandalone ? undefined : "_blank";
  const billingCtaRel = isStandalone ? undefined : "noreferrer noopener";

  useEffect(() => {
    const savedTheme = localStorage.getItem("socratic:theme");
    const useDark = savedTheme ? savedTheme === "dark" : false;
    document.documentElement.classList.toggle("app-dark", useDark);
    setIsDarkMode(useDark);
    setIsThemeReady(true);
  }, []);

  const applyTheme = useCallback((nextTheme: AppTheme, animate: boolean) => {
    const root = document.documentElement;
    const useDark = nextTheme === "dark";
    const currentTheme = root.classList.contains("app-dark") ? "dark" : "light";

    if (currentTheme === nextTheme && isThemeReady) {
      localStorage.setItem("socratic:theme", nextTheme);
      setIsDarkMode(useDark);
      return;
    }

    const commitTheme = () => {
      root.classList.toggle("app-dark", useDark);
      localStorage.setItem("socratic:theme", nextTheme);
      flushSync(() => {
        setIsDarkMode(useDark);
        setIsThemeReady(true);
      });
    };

    const viewTransitionDocument = document as Document & {
      startViewTransition?: (callback: () => void) => {
        finished: Promise<void>;
      };
    };
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!animate || prefersReducedMotion) {
      commitTheme();
      return;
    }

    if (typeof viewTransitionDocument.startViewTransition !== "function") {
      root.classList.add("theme-fade-fallback-out");

      window.setTimeout(() => {
        commitTheme();
        root.classList.remove("theme-fade-fallback-out");
        root.classList.add("theme-fade-fallback-in");

        window.setTimeout(() => {
          root.classList.remove("theme-fade-fallback-in");
        }, 680);
      }, 420);
      return;
    }

    root.classList.add("theme-fade-transition");
    const transition = viewTransitionDocument.startViewTransition(commitTheme);

    void transition.finished.finally(() => {
      root.classList.remove("theme-fade-transition");
    });
  }, [isThemeReady]);

  useEffect(() => {
    function handleThemeChanged(event: Event) {
      const customEvent = event as CustomEvent<{ theme?: AppTheme }>;
      const nextTheme = customEvent.detail?.theme;

      if (!nextTheme) {
        return;
      }

      applyTheme(nextTheme, true);
    }

    window.addEventListener("socratic:theme:changed", handleThemeChanged);
    return () => {
      window.removeEventListener("socratic:theme:changed", handleThemeChanged);
    };
  }, [applyTheme]);

  useEffect(() => {
    setMenuOpen(false);
    setShareMenuOpen(false);
    setActionDialog(null);
    setRenameValue("");
    setPendingAction(null);
    setShareUrl("");
    setShareTitle("");
    setShareError("");
    setCopied(false);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement;

      if (target.closest("[data-topbar-interactive]")) {
        return;
      }

      setMenuOpen(false);
      setShareMenuOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDialogBusy) {
        setMenuOpen(false);
        setShareMenuOpen(false);
        setActionDialog(null);
        setRenameValue("");
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDialogBusy]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, 1600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copied]);

  useEffect(() => {
    if (
      !activeDebate?.hasTimer ||
      !activeDebate.startedAt ||
      !debateDurationMeta?.minutes ||
      activeDebate.status === "COMPLETED"
    ) {
      return;
    }

    const syncTimeoutId = window.setTimeout(() => {
      setNowMs(Date.now());
    }, 0);

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearTimeout(syncTimeoutId);
      window.clearInterval(intervalId);
    };
  }, [
    activeDebate?.hasTimer,
    activeDebate?.startedAt,
    activeDebate?.status,
    debateDurationMeta?.minutes,
  ]);

  useEffect(() => {
    if (
      !activeSession ||
      !activeDebate ||
      activeDebate.status === "COMPLETED" ||
      !activeDebate.hasTimer ||
      remainingSeconds === null ||
      remainingSeconds > 0 ||
      finalizeRequestedRef.current
    ) {
      return;
    }

    finalizeRequestedRef.current = true;

    fetch("/api/v1/chat/debates/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: activeSession.id }),
    }).finally(() => {
      router.refresh();
    });
  }, [activeDebate, activeSession, remainingSeconds, router]);

  useEffect(() => {
    finalizeRequestedRef.current = false;
  }, [activeSession?.id]);

  async function handleEndDebate() {
    if (
      !activeSession ||
      !activeDebate ||
      activeDebate.status === "COMPLETED"
    ) {
      return;
    }

    setIsEndingDebate(true);

    try {
      await fetch("/api/v1/chat/debates/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSession.id }),
      });
      router.refresh();
    } finally {
      setIsEndingDebate(false);
    }
  }

  async function ensureShareLink() {
    if (!activeSession) {
      return null;
    }

    if (shareUrl) {
      return shareUrl;
    }

    setIsPreparingShare(true);
    setShareError("");

    try {
      const response = await fetch(
        `/api/v1/chat/sessions/${activeSession.id}/share`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        setShareError("Could not create share link.");
        return null;
      }

      const data = (await response.json()) as {
        shareUrl: string;
        title: string;
      };

      setShareUrl(data.shareUrl);
      setShareTitle(data.title);
      return data.shareUrl;
    } catch {
      setShareError("Could not create share link.");
      return null;
    } finally {
      setIsPreparingShare(false);
    }
  }

  async function handleShareMenuToggle() {
    if (!activeSession) {
      return;
    }

    const nextOpen = !shareMenuOpen;
    setShareMenuOpen(nextOpen);
    setMenuOpen(false);

    if (nextOpen) {
      await ensureShareLink();
    }
  }

  async function handleCopyLink() {
    const nextShareUrl = shareUrl || (await ensureShareLink());

    if (!nextShareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(nextShareUrl);
      setCopied(true);
    } catch {
      setShareError("Could not copy link.");
    }
  }

  function handleThemeChange(nextValue: boolean) {
    window.dispatchEvent(
      new CustomEvent("socratic:theme:changed", {
        detail: { theme: nextValue ? "dark" : "light" },
      }),
    );
  }

  function handleMobileSidebarToggle() {
    window.dispatchEvent(new CustomEvent("socratic:mobile-sidebar:toggle"));
  }

  function openShareTarget(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openRenameDialog() {
    if (!activeSession) return;

    setMenuOpen(false);
    setActionDialog({
      mode: "rename",
      sessionId: activeSession.id,
      currentTitle: activeSession.title || "Untitled Session",
    });
    setRenameValue(activeSession.title || "");
  }

  function openDeleteDialog() {
    if (!activeSession) return;

    setMenuOpen(false);
    setActionDialog({
      mode: "delete",
      sessionId: activeSession.id,
      currentTitle: activeSession.title || "Untitled Session",
    });
  }

  function closeDialog() {
    if (isDialogBusy) {
      return;
    }

    setActionDialog(null);
    setRenameValue("");
  }

  async function handleRenameSubmit() {
    if (!actionDialog || actionDialog.mode !== "rename" || isDialogBusy) {
      return;
    }

    const nextTitle = renameValue.trim();
    if (!nextTitle) {
      return;
    }

    setPendingAction("rename");

    try {
      const response = await fetch(
        `/api/v1/chat/sessions/${actionDialog.sessionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: nextTitle }),
        },
      );

      if (!response.ok) {
        return;
      }

      setActionDialog(null);
      setRenameValue("");
      router.refresh();
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDeleteSubmit() {
    if (!actionDialog || actionDialog.mode !== "delete" || isDialogBusy) {
      return;
    }

    setPendingAction("delete");

    try {
      const response = await fetch(
        `/api/v1/chat/sessions/${actionDialog.sessionId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        return;
      }

      const deletedId = actionDialog.sessionId;
      setActionDialog(null);
      setRenameValue("");

      if (isSessionPath(pathname, deletedId)) {
        router.push(appBasePath as Route);
      }

      router.refresh();
    } finally {
      setPendingAction(null);
    }
  }

  function pendingLabel(label: string) {
    return (
      <>
        <LoaderCircle size={12} className="animate-spin" />
        {label}
      </>
    );
  }

  function XBrandIcon() {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5 fill-black"
        aria-hidden="true"
      >
        <path d="M18.9 2H21l-6.55 7.49L22 22h-5.94l-4.65-7.6L4.76 22H2.64l7.01-8.01L2 2h6.09l4.2 6.92L18.9 2Zm-1.04 18h1.64L7.2 3.9H5.44Z" />
      </svg>
    );
  }

  function LinkedInIcon() {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5 fill-[#0A66C2]"
        aria-hidden="true"
      >
        <path d="M4.98 3.5A1.48 1.48 0 1 0 5 6.46 1.48 1.48 0 0 0 4.98 3.5ZM3.5 8h3V20h-3V8Zm5 0h2.88v1.64h.04c.4-.76 1.38-1.64 2.84-1.64 3.04 0 3.6 2 3.6 4.6V20h-3v-5.68c0-1.36-.02-3.1-1.9-3.1-1.9 0-2.2 1.48-2.2 3V20h-3V8Z" />
      </svg>
    );
  }

  function WhatsAppIcon() {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5 fill-[#25D366]"
        aria-hidden="true"
      >
        <path d="M12.04 2C6.55 2 2.1 6.44 2.1 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39a9.96 9.96 0 0 0 4.74 1.2h.01c5.48 0 9.94-4.44 9.94-9.91A9.9 9.9 0 0 0 12.04 2Zm0 18.14h-.01a8.28 8.28 0 0 1-4.22-1.15l-.3-.18-3.15.82.84-3.06-.2-.31a8.2 8.2 0 0 1-1.27-4.35c0-4.55 3.73-8.25 8.31-8.25 4.58 0 8.3 3.7 8.3 8.25 0 4.55-3.73 8.23-8.3 8.23Zm4.54-6.18c-.25-.12-1.48-.73-1.71-.82-.23-.08-.39-.12-.56.12-.17.25-.65.82-.8.98-.15.17-.29.18-.54.06-.25-.12-1.04-.38-1.98-1.21-.73-.65-1.22-1.45-1.36-1.69-.14-.25-.02-.38.1-.5.1-.1.25-.29.38-.43.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.08 0 1.22.9 2.4 1.02 2.56.12.17 1.76 2.68 4.26 3.75.59.25 1.05.4 1.41.52.59.18 1.12.15 1.54.09.47-.07 1.48-.6 1.69-1.18.21-.58.21-1.08.15-1.18-.06-.09-.23-.15-.48-.27Z" />
      </svg>
    );
  }

  function EmailIcon() {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="3" fill="#EA4335" />
        <path
          d="M6 8.2 12 12.8 18 8.2"
          fill="none"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <>
      <header className="app-topbar sticky top-0 z-20 flex h-12 shrink-0 items-center bg-white px-4 shadow-[inset_0_-0.5px_0_rgba(0,0,0,0.10)] md:h-12 md:px-6">
        <div className="flex min-w-0 flex-1 items-center lg:w-47 lg:flex-none">
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={handleMobileSidebarToggle}
              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-slate-800 transition hover:bg-slate-100/70 active:bg-slate-100"
              aria-label="Open sidebar"
              data-tooltip="Open sidebar"
            >
              <PanelLeftOpen size={22} />
            </button>
          </div>

          {activeSession && (
            <div className="hidden items-center gap-2 lg:flex">
              <div className="relative" data-topbar-interactive="">
                <button
                  type="button"
                  onClick={() => void handleShareMenuToggle()}
                  className={cn(
                    "app-topbar-share-btn inline-flex cursor-pointer items-center gap-1.5 rounded-[9px] border px-3 py-1.5 text-[14px] transition",
                    isDarkMode
                      ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      : "border-[#e3e1d8] bg-[#fefefc] text-[#6b6a66] hover:bg-[#e2dfd6] hover:text-[#1f1f1d]",
                  )}
                  data-tooltip="Share chat"
                >
                  <Send size={15} />
                  Share
                </button>

                {shareMenuOpen && (
                  <div className="app-card app-topbar-share-menu absolute left-0 top-full z-40 mt-1.5 w-53.5 origin-top-left rounded-[9px] bg-white p-1.5 shadow-[0_0_0_0.5px_#C9C9C3,0_8px_18px_rgba(26,26,26,0.06)] animate-[dropdownSlideIn_180ms_cubic-bezier(0.22,1,0.36,1)_both]">
                    <button
                      type="button"
                      onClick={() => void handleCopyLink()}
                      disabled={isPreparingShare}
                      className="app-topbar-menu-item flex w-full cursor-pointer items-center justify-between rounded-[9px] px-2.5 py-2 text-left text-[12px] text-[#1A1A1A] transition hover:bg-[#F6F6F3] disabled:cursor-not-allowed disabled:opacity-50"
                      data-tooltip="Copy share link"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Copy size={13} />
                        {copied ? "Copied" : "Copy link"}
                      </span>
                      {isPreparingShare && (
                        <LoaderCircle
                          size={12}
                          className="animate-spin text-slate-400"
                        />
                      )}
                    </button>

                    <div className="mt-1.5 grid grid-cols-4 gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          openShareTarget(
                            `https://twitter.com/intent/tweet?url=${encodedShareUrl}&text=${encodedShareText}`,
                          )
                        }
                        disabled={!shareUrl || isPreparingShare}
                        className="app-topbar-menu-item flex cursor-pointer flex-col items-center gap-1 rounded-[9px] px-1.5 py-2 text-[10px] text-[#6B6B6B] transition hover:bg-[#F6F6F3] disabled:cursor-not-allowed disabled:opacity-45"
                        data-tooltip="Share to X"
                      >
                        <XBrandIcon />
                        <span>X</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          openShareTarget(
                            `https://www.linkedin.com/sharing/share-offsite/?url=${encodedShareUrl}`,
                          )
                        }
                        disabled={!shareUrl || isPreparingShare}
                        className="app-topbar-menu-item flex cursor-pointer flex-col items-center gap-1 rounded-[9px] px-1.5 py-2 text-[10px] text-[#6B6B6B] transition hover:bg-[#F6F6F3] disabled:cursor-not-allowed disabled:opacity-45"
                        data-tooltip="Share to LinkedIn"
                      >
                        <LinkedInIcon />
                        <span>LinkedIn</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          openShareTarget(
                            `https://wa.me/?text=${encodeURIComponent(
                              `${shareTitle ? `Check out this Socratic AI chat: ${shareTitle}\n` : ""}${shareUrl}`,
                            )}`,
                          )
                        }
                        disabled={!shareUrl || isPreparingShare}
                        className="app-topbar-menu-item flex cursor-pointer flex-col items-center gap-1 rounded-[9px] px-1.5 py-2 text-[10px] text-[#6B6B6B] transition hover:bg-[#F6F6F3] disabled:cursor-not-allowed disabled:opacity-45"
                        data-tooltip="Share to WhatsApp"
                      >
                        <WhatsAppIcon />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          openShareTarget(
                            `mailto:?subject=${encodeURIComponent(
                              shareTitle || "Socratic AI chat",
                            )}&body=${encodeURIComponent(shareUrl)}`,
                          )
                        }
                        disabled={!shareUrl || isPreparingShare}
                        className="app-topbar-menu-item flex cursor-pointer flex-col items-center gap-1 rounded-[9px] px-1.5 py-2 text-[10px] text-[#6B6B6B] transition hover:bg-[#F6F6F3] disabled:cursor-not-allowed disabled:opacity-45"
                        data-tooltip="Share via email"
                      >
                        <EmailIcon />
                        <span>Email</span>
                      </button>
                    </div>

                    {shareError && (
                      <p className="mt-1.5 px-2 text-[10px] text-rose-600">
                        {shareError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hidden min-w-0 flex-1 justify-center lg:flex">
          <div className="relative" data-topbar-interactive="">
            <button
              type="button"
              onClick={() => {
                if (!activeSession) {
                  return;
                }

                setShareMenuOpen(false);
                setMenuOpen((current) => !current);
              }}
              disabled={!activeSession}
              className={cn(
                "app-topbar-title-trigger inline-flex max-w-85 tracking-wide items-center gap-1.5 rounded-[9px] px-2.5 py-1.5 text-[14px]",
                activeSession
                  ? isDarkMode
                    ? "cursor-pointer text-slate-700 transition hover:bg-[#f4f4f4] hover:text-slate-900"
                    : "cursor-pointer text-[#6b6a66] transition hover:bg-[#e2dfd6] hover:text-[#1f1f1d]"
                  : "cursor-default",
              )}
              data-tooltip={activeSession ? "Chat menu" : "No active chat"}
            >
              {activeSession && activeSession.mode !== "SOCRATIC" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-1.5 py-0.5 text-[11px] uppercase tracking-[0.09em] text-slate-600">
                  {activeSession.mode === "DEBATE" ? (
                    <Swords size={11} />
                  ) : (
                    <ScrollText size={11} />
                  )}
                  {activeSession.mode === "DEBATE" ? "Debate" : "Roleplay"}
                </span>
              )}
              <span className={`${inter.className} truncate`}>{title}</span>
              {activeSession && <ChevronDown size={15} className="shrink-0" />}
            </button>

            {menuOpen && activeSession && (
              <div className="app-card app-topbar-title-menu absolute left-1/2 top-full z-40 mt-1.5 w-31 origin-top -translate-x-1/2 rounded-[9px] bg-white p-1.5 shadow-[0_0_0_0.5px_#C9C9C3,0_8px_18px_rgba(26,26,26,0.06)] animate-[dropdownSlideIn_180ms_cubic-bezier(0.22,1,0.36,1)_both]">
                <button
                  type="button"
                  onClick={openRenameDialog}
                  className="app-topbar-menu-item flex w-full cursor-pointer items-center gap-2 rounded-[9px] px-2.5 py-2 text-left text-[12px] text-[#1A1A1A] transition hover:bg-[#F6F6F3]"
                  data-tooltip="Rename chat"
                >
                  <Pencil size={13} />
                  Rename
                </button>
                <button
                  type="button"
                  onClick={openDeleteDialog}
                  className="app-topbar-menu-danger flex w-full cursor-pointer items-center gap-2 rounded-[9px] px-2.5 py-2 text-left text-[12px] text-[#EF4444] transition hover:bg-rose-50"
                  data-tooltip="Delete chat"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 lg:w-60 lg:flex-none lg:gap-3">
          {activeDebate?.hasTimer && remainingSeconds !== null && (
            <div className="inline-flex items-center gap-1.5 rounded-[9px] border border-slate-300 bg-white px-3 py-1.5 text-[14px] text-slate-700 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
              <Clock3 size={15} className="text-slate-500" />
              <span
                className="font-medium tabular-nums"
                suppressHydrationWarning
              >
                {remainingSeconds === null
                  ? "--:--"
                  : formatDebateCountdown(remainingSeconds)}
              </span>
            </div>
          )}

          {activeDebate &&
            !activeDebate.hasTimer &&
            activeDebate.status !== "COMPLETED" && (
              <button
                type="button"
                onClick={handleEndDebate}
                disabled={isEndingDebate}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[9px] border px-3 py-1.5 text-[14px] shadow-[0_1px_0_rgba(0,0,0,0.03)] transition disabled:cursor-not-allowed disabled:opacity-70",
                  isDarkMode
                    ? "cursor-pointer border-[#6a3a3a] bg-[#382424] text-[#f2c2c2] hover:border-[#805050] hover:bg-[#452a2a]"
                    : "cursor-pointer border-[#f2c7c7] bg-[#fff1f1] text-[#b54747] hover:border-[#eab4b4] hover:bg-[#ffe8e8]",
                )}
              >
                {isEndingDebate ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <X size={15} />
                )}
                End Debate
              </button>
            )}

          <button
            type="button"
            onClick={() => handleThemeChange(!isDarkMode)}
            className={cn(
              "app-topbar-theme-toggle hidden h-9 w-9 cursor-pointer items-center justify-center rounded-[9px] border transition lg:inline-flex",
              isDarkMode
                ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                : "border-[#e3e1d8] bg-[#fefefc] text-[#6b6a66] hover:bg-[#e2dfd6] hover:text-[#1f1f1d]",
            )}
            aria-label={
              isDarkMode ? "Switch to light mode" : "Switch to dark mode"
            }
            data-tooltip={
              isDarkMode ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isDarkMode ? "sun" : "moon"}
                initial={{ opacity: 0, rotate: -45, scale: 0.7 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 45, scale: 0.7 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="grid place-items-center"
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </motion.span>
            </AnimatePresence>
          </button>

          <Link
            href={billingCtaHref}
            target={billingCtaTarget}
            rel={billingCtaRel}
            className="hidden cursor-pointer items-center justify-center rounded-full p-0 transition-transform duration-250 hover:-translate-y-0.5 lg:inline-flex lg:h-12 lg:w-12"
            aria-label={isPremium ? "Open billing" : "Upgrade to Socratic Plus"}
            data-tooltip={isPremium ? "Socratic +" : "Upgrade to Socratic Plus"}
          >
            <PremiumCrownIcon
              className="h-[2.15rem] w-[2.15rem] lg:h-9 lg:w-9"
              crownClassName="h-[1em] w-[1em]"
            />
          </Link>

          <div className="hidden items-center lg:flex">
            <AppUserButton size="md" />
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            {isPremium ? (
              <Link
                href={billingCtaHref}
                target={billingCtaTarget}
                rel={billingCtaRel}
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full p-0"
                aria-label="Open billing"
                data-tooltip="Socratic +"
              >
                <PremiumCrownIcon
                  className="h-9 w-9"
                  crownClassName="h-[1em] w-[1em]"
                />
              </Link>
            ) : null}
            <AppUserButton size="md" />
          </div>
        </div>
      </header>

      {actionDialog && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/16 p-4 backdrop-blur-[2px]"
          onClick={() => {
            if (!isDialogBusy) {
              closeDialog();
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
                onClick={closeDialog}
                disabled={isDialogBusy}
                className="cursor-pointer rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                data-tooltip="Close dialog"
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
                      void handleRenameSubmit();
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
                    onClick={closeDialog}
                    disabled={isDialogBusy}
                    className="app-session-dialog-cancel cursor-pointer rounded-[14px] border border-slate-300 px-3 py-2 text-[13px] text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                    data-tooltip="Cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRenameSubmit()}
                    disabled={isDialogBusy || !renameValue.trim()}
                    className="app-session-dialog-save inline-flex cursor-pointer items-center gap-1.5 rounded-[14px] bg-slate-900 px-3 py-2 text-[13px] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    data-tooltip="Save title"
                  >
                    {pendingAction === "rename" ? (
                      pendingLabel("Saving...")
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
                    onClick={closeDialog}
                    disabled={isDialogBusy}
                    className="app-session-dialog-cancel cursor-pointer rounded-[14px] border border-slate-300 px-3 py-2 text-[13px] text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                    data-tooltip="Cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteSubmit()}
                    disabled={isDialogBusy}
                    className="app-session-dialog-delete inline-flex cursor-pointer items-center gap-1.5 rounded-[14px] bg-rose-600 px-3 py-2 text-[13px] text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                    data-tooltip="Delete chat"
                  >
                    {pendingAction === "delete" ? (
                      pendingLabel("Deleting...")
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
    </>
  );
}
