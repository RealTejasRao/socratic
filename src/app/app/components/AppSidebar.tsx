"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  CircleCheck,
  ChevronDown,
  House,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  PenSquare,
  Search,
  Settings,
  X,
} from "lucide-react";
import { ROUTES } from "src/lib/routes";
import { Switch } from "@/src/components/ui/switch";
import {
  SOCRATIC_TONE_OPTIONS,
  isSocraticTone,
  type SocraticTone,
} from "src/lib/socratic";
import {
  CHAT_FONT_SIZE_OPTIONS,
  isChatFontSize,
  type ChatFontSize,
} from "src/lib/chat-display";
import type { DebateSessionState, RoleplaySessionState } from "src/types/chat";
import SidebarSearch from "./SidebarSearch";
import SidebarSessions from "./SidebarSessions";

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
}

const poppinsClassName = "[font-family:Poppins,sans-serif]";
const smoothUiClass =
  "transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]";
const COLLAPSE_BY_DEFAULT_KEY = "socratic:sidebar:collapseByDefault";
const SHOW_HOVER_PREVIEWS_KEY = "socratic:sidebar:showHoverPreviews";
const SHOW_MODE_BADGES_KEY = "socratic:sidebar:showModeBadges";
const THEME_KEY = "socratic:theme";
const SOCRATIC_TONE_KEY = "socratic:settings:socraticTone";
const CHAT_FONT_SIZE_KEY = "socratic:chat:fontSize";

function readBooleanSetting(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value === "true";
  } catch {
    return fallback;
  }
}

function readSocraticToneSetting(): SocraticTone {
  if (typeof window === "undefined") {
    return "RUTHLESS_BLUNT";
  }

  try {
    const value = localStorage.getItem(SOCRATIC_TONE_KEY);
    return isSocraticTone(value) ? value : "RUTHLESS_BLUNT";
  } catch {
    return "RUTHLESS_BLUNT";
  }
}

function readChatFontSizeSetting(): ChatFontSize {
  if (typeof window === "undefined") {
    return "MEDIUM";
  }

  try {
    const value = localStorage.getItem(CHAT_FONT_SIZE_KEY);
    return isChatFontSize(value) ? value : "MEDIUM";
  } catch {
    return "MEDIUM";
  }
}

export default function AppSidebar({ sessions }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [collapseByDefault, setCollapseByDefault] = useState(false);
  const [showHoverPreviews, setShowHoverPreviews] = useState(true);
  const [showModeBadges, setShowModeBadges] = useState(true);
  const [socraticTone, setSocraticTone] = useState<SocraticTone>("RUTHLESS_BLUNT");
  const [chatFontSize, setChatFontSize] = useState<ChatFontSize>("MEDIUM");
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    "GENERAL" | "SOCRATIC"
  >("GENERAL");
  const [isToneDropdownOpen, setIsToneDropdownOpen] = useState(false);
  const [isResetDefaultsConfirmOpen, setIsResetDefaultsConfirmOpen] =
    useState(false);
  const [showResetSuccessToast, setShowResetSuccessToast] = useState(false);
  const toneDropdownRef = useRef<HTMLDivElement | null>(null);
  const resetToastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      const persistedCollapseByDefault = readBooleanSetting(
        COLLAPSE_BY_DEFAULT_KEY,
        false,
      );
      setCollapseByDefault(persistedCollapseByDefault);
      setCollapsed(persistedCollapseByDefault);
      setShowHoverPreviews(readBooleanSetting(SHOW_HOVER_PREVIEWS_KEY, true));
      setShowModeBadges(readBooleanSetting(SHOW_MODE_BADGES_KEY, true));
      setSocraticTone(readSocraticToneSetting());
      setChatFontSize(readChatFontSizeSetting());
    });
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => {
      setIsDarkMode(root.classList.contains("app-dark"));
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isSettingsOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (isResetDefaultsConfirmOpen) {
          setIsResetDefaultsConfirmOpen(false);
          return;
        }

        if (isToneDropdownOpen) {
          setIsToneDropdownOpen(false);
          return;
        }

        setIsSettingsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isResetDefaultsConfirmOpen, isSettingsOpen, isToneDropdownOpen]);

  useEffect(() => {
    if (!isSettingsOpen || !isToneDropdownOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!toneDropdownRef.current?.contains(event.target as Node)) {
        setIsToneDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isSettingsOpen, isToneDropdownOpen]);

  useEffect(() => {
    return () => {
      if (resetToastTimeoutRef.current !== null) {
        window.clearTimeout(resetToastTimeoutRef.current);
      }
    };
  }, []);

  function handleCollapseDefaultChange(nextValue: boolean) {
    setCollapseByDefault(nextValue);
    setCollapsed(nextValue);
    localStorage.setItem(COLLAPSE_BY_DEFAULT_KEY, String(nextValue));
  }

  function handleHoverPreviewsChange(nextValue: boolean) {
    setShowHoverPreviews(nextValue);
    localStorage.setItem(SHOW_HOVER_PREVIEWS_KEY, String(nextValue));
  }

  function handleModeBadgesChange(nextValue: boolean) {
    setShowModeBadges(nextValue);
    localStorage.setItem(SHOW_MODE_BADGES_KEY, String(nextValue));
  }

  function handleSocraticToneChange(nextTone: SocraticTone) {
    setSocraticTone(nextTone);
    localStorage.setItem(SOCRATIC_TONE_KEY, nextTone);
    setIsToneDropdownOpen(false);
  }

  function handleThemePreference(nextTheme: "light" | "dark") {
    const root = document.documentElement;
    const useDark = nextTheme === "dark";
    root.classList.toggle("app-dark", useDark);
    localStorage.setItem(THEME_KEY, nextTheme);
    setIsDarkMode(useDark);
    window.dispatchEvent(
      new CustomEvent("socratic:theme:changed", {
        detail: { theme: nextTheme },
      }),
    );
  }

  function handleChatFontSizeChange(nextSize: ChatFontSize) {
    setChatFontSize(nextSize);
    localStorage.setItem(CHAT_FONT_SIZE_KEY, nextSize);
    window.dispatchEvent(
      new CustomEvent("socratic:chat-font-size:changed", {
        detail: { size: nextSize },
      }),
    );
  }

  function handleResetSettings() {
    handleCollapseDefaultChange(false);
    handleHoverPreviewsChange(true);
    handleModeBadgesChange(true);
    handleSocraticToneChange("RUTHLESS_BLUNT");
    handleChatFontSizeChange("MEDIUM");
  }

  function showResetToast() {
    setShowResetSuccessToast(true);
    if (resetToastTimeoutRef.current !== null) {
      window.clearTimeout(resetToastTimeoutRef.current);
    }
    resetToastTimeoutRef.current = window.setTimeout(() => {
      setShowResetSuccessToast(false);
    }, 1900);
  }

  function handleNewChatClick() {
    window.dispatchEvent(new CustomEvent("socratic:new-chat:requested"));
  }

  return (
    <>
      <AnimatePresence>
        {showResetSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed right-4 top-4 z-[140]"
          >
            <div className="app-session-success-toast flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/96 px-3 py-2 text-[11px] text-emerald-800 shadow-[0_14px_34px_rgba(16,185,129,0.14)] backdrop-blur-sm">
              <CircleCheck
                size={14}
                className="app-session-success-toast-icon text-emerald-600"
              />
              <span className="app-session-success-toast-text">
                Reset successfully
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 58 : 248 }}
        transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.9 }}
        className={`${poppinsClassName} app-sidebar relative hidden shrink-0 overflow-visible border-r border-transparent bg-[#f9f9f9] p-2 shadow-[inset_-0.5px_0_0_rgba(0,0,0,0.10)] lg:flex lg:flex-col`}
      >
        <div
          className={`mb-2 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}
        >
          <Link
            href={ROUTES.APP}
            className={
              collapsed
                ? "flex items-center justify-center"
                : "flex items-center gap-2.5 px-1"
            }
          >
            <span className="relative h-7 w-7 shrink-0">
              <Image
                src="/brand/Logo_Dark_SVG.svg"
                alt="Socratic AI logo"
                width={30}
                height={30}
                className="app-brand-logo-dark h-7 w-7 object-contain"
                priority
              />
              <Image
                src="/brand/Logo_Light.png"
                alt="Socratic AI logo"
                width={30}
                height={30}
                className="app-brand-logo-light absolute inset-0 h-7 w-7 object-contain"
                priority
              />
            </span>
            {!collapsed && (
              <span className="text-[20px] tracking-wide font-normal text-slate-900 font-[Georgia,serif]">
                Socratic AI
              </span>
            )}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          className="app-sidebar-toggle absolute top-6.5 -right-3 z-30 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-slate-600 transition hover:bg-slate-300 hover:text-slate-900"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          data-tooltip={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen size={13} />
          ) : (
            <PanelLeftClose size={13} />
          )}
        </button>

        {collapsed ? (
          <>
            <div className="mt-1 flex flex-col items-center gap-0.5">
              <Link
                href={ROUTES.APP}
                onClick={handleNewChatClick}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-black transition hover:bg-white/70 hover:text-black"
                aria-label="New chat"
              >
                <PenSquare size={13} />
              </Link>
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-black transition hover:bg-white/70 hover:text-black"
                aria-label="Expand search and sidebar"
              >
                <Search size={13} />
              </button>
            </div>

            <div className="mt-auto space-y-0.5 border-t border-slate-200 pt-2">
              <Link
                href={ROUTES.HOME}
                className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg text-black transition hover:bg-white/70 hover:text-black"
                aria-label="Home"
              >
                <House size={13} />
              </Link>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className={`mx-auto flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-black hover:bg-white/70 hover:text-black ${smoothUiClass}`}
                aria-label="Settings"
              >
                <Settings size={13} />
              </button>
              <Link
                href={`${ROUTES.HOME}#contact`}
                target="_blank"
                rel="noreferrer"
                className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg text-black transition hover:bg-white/70 hover:text-black"
                aria-label="Contact us"
              >
                <Mail size={13} />
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mb-1 border-t border-slate-200" />

            <div className="mb-1 mt-1">
              <Link
                href={ROUTES.APP}
                onClick={handleNewChatClick}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.25 text-[11px] text-black/90 transition hover:bg-white/70 hover:text-black"
              >
                <PenSquare size={12} />
                <span>New Chat</span>
              </Link>
            </div>

            <SidebarSearch />

            <div className="sidebar-scroll mt-2 min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
              <p className="mb-1.5 px-2 text-[8px] uppercase tracking-[0.18em] text-slate-400">
                Chats
              </p>
              <SidebarSessions
                sessions={sessions}
                showHoverPreviews={showHoverPreviews}
                showModeBadges={showModeBadges}
              />
            </div>

            <div className="mt-3 space-y-0.5 border-t border-slate-200 pt-2">
              <Link
                href={ROUTES.HOME}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.25 text-[11px] text-black/90 hover:bg-white/70 hover:text-black"
              >
                <House size={12} /> Home
              </Link>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.25 text-[11px] text-black/90 hover:bg-white/70 hover:text-black ${smoothUiClass}`}
              >
                <Settings size={12} /> Settings
              </button>
              <Link
                href={`${ROUTES.HOME}#contact`}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.25 text-[11px] text-black/90 hover:bg-white/70 hover:text-black"
              >
                <Mail size={12} /> Send Us a Message
              </Link>
            </div>
          </>
        )}
      </motion.aside>

      <AnimatePresence mode="wait" initial={false}>
        {isSettingsOpen && (
          <motion.div
            key="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-[2px] ${
              isDarkMode ? "bg-black/45" : "bg-slate-950/16"
            }`}
            onClick={() => {
              setIsToneDropdownOpen(false);
              setIsSettingsOpen(false);
            }}
          >
            <motion.div
              key="settings-panel"
              initial={{ opacity: 0, y: 14, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.985 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              style={{ willChange: "transform, opacity" }}
              className={`app-card relative z-[121] flex h-[min(520px,82vh)] w-[min(760px,90vw)] overflow-hidden rounded-2xl border shadow-[0_22px_70px_rgba(15,23,42,0.24)] ${
                isDarkMode
                  ? "border-[#3d3d42] bg-[#262624]"
                  : "border-slate-200 bg-white"
              }`}
              role="dialog"
              aria-modal="true"
              aria-label="Settings"
              onClick={(event) => event.stopPropagation()}
            >
            <aside
              className={`w-46 shrink-0 border-r p-3 ${
                isDarkMode
                  ? "border-[#3d3d42] bg-[#242321]"
                  : "border-slate-200 bg-slate-50/65"
              }`}
            >
              <p
                className={`px-2 pb-2 text-[10px] uppercase tracking-[0.14em] ${
                  isDarkMode ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Settings
              </p>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveSettingsTab("GENERAL")}
                  className={`w-full cursor-pointer rounded-lg px-2.5 py-2 text-left text-[11px] ${smoothUiClass} ${
                    activeSettingsTab === "GENERAL"
                      ? isDarkMode
                        ? "bg-[#35363a] text-slate-100"
                        : "bg-slate-200 text-slate-900"
                      : isDarkMode
                        ? "text-slate-300 hover:bg-[#2d2e32] hover:text-slate-100"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  General
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSettingsTab("SOCRATIC")}
                  className={`w-full cursor-pointer rounded-lg px-2.5 py-2 text-left text-[11px] ${smoothUiClass} ${
                    activeSettingsTab === "SOCRATIC"
                      ? isDarkMode
                        ? "bg-[#35363a] text-slate-100"
                        : "bg-slate-200 text-slate-900"
                      : isDarkMode
                        ? "text-slate-300 hover:bg-[#2d2e32] hover:text-slate-100"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  Socratic
                </button>
              </div>
            </aside>

            <section
              className={`flex min-w-0 flex-1 flex-col px-6 py-5 ${
                isDarkMode ? "bg-[#262624]" : "bg-white"
              }`}
            >
              <div>
                <p
                  className={`text-[18px] font-medium ${
                    isDarkMode ? "text-slate-100" : "text-slate-900"
                  } ${activeSettingsTab === "GENERAL" ? "font-[Georgia,serif]" : ""}`}
                >
                  {activeSettingsTab === "GENERAL" ? "General" : "Socratic"}
                </p>
                {activeSettingsTab === "SOCRATIC" && (
                  <p
                    className={`mt-1 text-[11px] ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Tone controls that apply only to Socratic mode.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className={`absolute right-5 top-4 cursor-pointer rounded-full p-1 ${smoothUiClass} ${
                  isDarkMode
                    ? "text-slate-400 hover:bg-[#36373b] hover:text-slate-200"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                }`}
                aria-label="Close settings"
              >
                <X size={13} />
              </button>

              <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
                <AnimatePresence mode="wait" initial={false}>
                  {activeSettingsTab === "GENERAL" ? (
                    <motion.div
                      key="settings-general-tab"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className={`border-t ${
                        isDarkMode
                          ? "border-[#444444]"
                          : "border-[#d0d7e2]"
                      }`}
                    >
                    <div
                      className={`flex items-center justify-between gap-4 border-b py-3 ${
                        isDarkMode
                          ? "border-[#3a3a3a]"
                          : "border-[#d8dee7]"
                      }`}
                    >
                      <div>
                        <p
                          className={`text-[13px] ${
                            isDarkMode ? "text-slate-100" : "text-slate-800"
                          }`}
                        >
                          Theme
                        </p>
                      </div>
                      <div
                        className={`inline-flex rounded-lg border p-0.5 ${
                          isDarkMode
                            ? "border-[#44454a] bg-[#25262a]"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleThemePreference("light")}
                          className={`relative cursor-pointer overflow-hidden rounded-md px-3 py-1 text-[11px] ${smoothUiClass} ${
                            !isDarkMode
                              ? "text-slate-900"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {!isDarkMode && (
                            <motion.span
                              layoutId="settings-theme-active-pill"
                              className={`absolute inset-0 rounded-md ${
                                isDarkMode
                                  ? "bg-[#3a3b40] shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
                                  : "bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                              }`}
                              transition={{
                                type: "spring",
                                stiffness: 320,
                                damping: 28,
                                mass: 0.7,
                              }}
                            />
                          )}
                          <span className="relative z-10">Light</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleThemePreference("dark")}
                          className={`relative cursor-pointer overflow-hidden rounded-md px-3 py-1 text-[11px] ${smoothUiClass} ${
                            isDarkMode
                              ? "text-slate-100"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {isDarkMode && (
                            <motion.span
                              layoutId="settings-theme-active-pill"
                              className={`absolute inset-0 rounded-md ${
                                isDarkMode
                                  ? "bg-[#3a3b40] shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
                                  : "bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                              }`}
                              transition={{
                                type: "spring",
                                stiffness: 320,
                                damping: 28,
                                mass: 0.7,
                              }}
                            />
                          )}
                          <span className="relative z-10">Dark</span>
                        </button>
                      </div>
                    </div>

                    <label
                      className={`flex items-center justify-between gap-4 border-b py-3 ${
                        isDarkMode
                          ? "border-[#3a3a3a]"
                          : "border-[#d8dee7]"
                      }`}
                    >
                      <div>
                        <p
                          className={`text-[13px] ${
                            isDarkMode ? "text-slate-100" : "text-slate-800"
                          }`}
                        >
                          Collapsed Sidebar
                        </p>
                      </div>
                      <Switch
                        checked={collapseByDefault}
                        onCheckedChange={handleCollapseDefaultChange}
                        aria-label="Start with collapsed sidebar"
                      />
                    </label>

                    <label
                      className={`flex items-center justify-between gap-4 border-b py-3 ${
                        isDarkMode
                          ? "border-[#3a3a3a]"
                          : "border-[#d8dee7]"
                      }`}
                    >
                      <div>
                        <p
                          className={`text-[13px] ${
                            isDarkMode ? "text-slate-100" : "text-slate-800"
                          }`}
                        >
                          Chat Hover Previews on Sidebar
                        </p>
                      </div>
                      <Switch
                        checked={showHoverPreviews}
                        onCheckedChange={handleHoverPreviewsChange}
                        aria-label="Show chat preview on hover"
                      />
                    </label>

                    <label
                      className={`flex items-center justify-between gap-4 border-b py-3 ${
                        isDarkMode
                          ? "border-[#3a3a3a]"
                          : "border-[#d8dee7]"
                      }`}
                    >
                      <div>
                        <p
                          className={`text-[13px] ${
                            isDarkMode ? "text-slate-100" : "text-slate-800"
                          }`}
                        >
                          Show mode badges on Sidebar
                        </p>
                      </div>
                      <Switch
                        checked={showModeBadges}
                        onCheckedChange={handleModeBadgesChange}
                        aria-label="Show mode badges in chat list"
                      />
                    </label>

                    <div className="flex items-center justify-between gap-4 py-3">
                      <div>
                        <p
                          className={`text-[13px] ${
                            isDarkMode ? "text-slate-100" : "text-slate-800"
                          }`}
                        >
                          Chat text size
                        </p>
                      </div>
                      <div
                        className={`relative inline-flex rounded-lg border p-0.5 ${
                          isDarkMode
                            ? "border-[#44454a] bg-[#25262a]"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        {CHAT_FONT_SIZE_OPTIONS.map((option) => {
                          const isActive = chatFontSize === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                handleChatFontSizeChange(option.value)
                              }
                              className={`relative cursor-pointer overflow-hidden rounded-md px-3 py-1 text-[11px] ${smoothUiClass} ${
                                isActive
                                  ? isDarkMode
                                    ? "text-slate-100"
                                    : "text-slate-900"
                                  : isDarkMode
                                    ? "text-slate-400 hover:text-slate-200"
                                    : "text-slate-500 hover:text-slate-700"
                              }`}
                            >
                              {isActive && (
                                <motion.span
                                  layoutId="chat-font-size-active-pill"
                                  className={`absolute inset-0 rounded-md ${
                                    isDarkMode
                                      ? "bg-[#3a3b40] shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
                                      : "bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                                  }`}
                                  transition={{
                                    type: "spring",
                                    stiffness: 320,
                                    damping: 28,
                                    mass: 0.7,
                                  }}
                                />
                              )}
                              <span className="relative z-10">{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="settings-socratic-tab"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className={`border-t ${
                      isDarkMode
                        ? "border-[#444444]"
                        : "border-[#d0d7e2]"
                    }`}
                  >
                    <div
                      className={`border-b py-3 ${
                        isDarkMode
                          ? "border-[#3a3a3a]"
                          : "border-[#d8dee7]"
                      }`}
                    >
                      <p
                        className={`text-[13px] ${
                          isDarkMode ? "text-slate-100" : "text-slate-800"
                        }`}
                      >
                        Tone
                      </p>
                      <p
                        className={`mt-0.5 text-[11px] ${
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        Applied only in Socratic mode.
                      </p>

                      <div ref={toneDropdownRef} className="relative mt-2">
                        <button
                          type="button"
                          onClick={() =>
                            setIsToneDropdownOpen((current) => !current)
                          }
                          className={`flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-left text-[11px] ${smoothUiClass} ${
                            isDarkMode
                              ? "border-[#4a4b50] bg-[#25262a] text-slate-100 hover:border-[#5b5c62] hover:bg-[#2d2e33]"
                              : "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-slate-100"
                          }`}
                          aria-expanded={isToneDropdownOpen}
                          aria-label="Select Socratic tone"
                        >
                          <span>
                            {SOCRATIC_TONE_OPTIONS.find(
                              (option) => option.value === socraticTone,
                            )?.label ?? "Balanced"}
                          </span>
                          <ChevronDown
                            size={13}
                            className={`text-slate-500 transition-transform ${
                              isToneDropdownOpen ? "rotate-180" : "rotate-0"
                            }`}
                          />
                        </button>

                        <AnimatePresence>
                          {isToneDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -4, scale: 0.99 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -4, scale: 0.99 }}
                              transition={{
                                duration: 0.16,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className={`absolute left-0 right-0 z-20 mt-1.5 rounded-lg border p-1 shadow-[0_10px_30px_rgba(15,23,42,0.10)] ${
                                isDarkMode
                                  ? "border-[#4a4b50] bg-[#2c2d32]"
                                  : "border-slate-200 bg-white"
                              }`}
                            >
                              {SOCRATIC_TONE_OPTIONS.map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() =>
                                    handleSocraticToneChange(option.value)
                                  }
                                  className={`w-full cursor-pointer rounded-md px-2.5 py-2 text-left ${smoothUiClass} ${
                                    socraticTone === option.value
                                      ? isDarkMode
                                        ? "bg-[#3a3b40] text-slate-100"
                                        : "bg-slate-100 text-slate-900"
                                      : isDarkMode
                                        ? "text-slate-200 hover:bg-[#35363b]"
                                        : "text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  <p className="text-[10px] font-medium">
                                    {option.label}
                                  </p>
                                  <p
                                    className={`mt-0.5 text-[9px] ${
                                      isDarkMode
                                        ? "text-slate-400"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    {option.description}
                                  </p>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <p
                        className={`mt-2 text-[11px] ${
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {
                          SOCRATIC_TONE_OPTIONS.find(
                            (option) => option.value === socraticTone,
                          )?.description
                        }
                      </p>
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>

              <div
                className={`mt-4 flex items-center justify-between border-t pt-3 ${
                  isDarkMode ? "border-[#3a3a3a]" : "border-[#d0d7e2]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setIsResetDefaultsConfirmOpen(true)}
                  className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[10px] ${smoothUiClass} ${
                    isDarkMode
                      ? "border-[#4a4b50] text-slate-300 hover:bg-[#121212] hover:text-slate-100"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  Reset defaults
                </button>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-[10px] text-white ${smoothUiClass} ${
                    isDarkMode
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  Done
                </button>
              </div>

              <AnimatePresence>
                {isResetDefaultsConfirmOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                    className={`absolute inset-0 z-[130] flex items-center justify-center p-4 ${
                      isDarkMode ? "bg-black/45" : "bg-slate-950/16"
                    }`}
                    onClick={() => setIsResetDefaultsConfirmOpen(false)}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.985 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.985 }}
                      transition={{
                        duration: 0.18,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className={`app-card w-full max-w-[340px] rounded-xl border p-4 ${
                        isDarkMode
                          ? "border-[#4a4946] bg-[#2b2a28]"
                          : "border-slate-200 bg-white"
                      }`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <p
                        className={`text-[14px] leading-5 font-medium ${
                          isDarkMode ? "text-slate-100" : "text-slate-900"
                        }`}
                      >
                        Reset all General settings to default?
                      </p>

                      <div className="mt-4 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsResetDefaultsConfirmOpen(false)}
                          className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[11px] ${smoothUiClass} ${
                            isDarkMode
                              ? "border-[#4a4946] text-slate-300 hover:bg-[#333230] hover:text-slate-100"
                              : "border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleResetSettings();
                            setIsResetDefaultsConfirmOpen(false);
                            showResetToast();
                          }}
                          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] text-white hover:bg-rose-700 ${smoothUiClass}`}
                        >
                          Reset
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
