"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inter } from "next/font/google";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  CircleCheck,
  Crown,
  ChevronDown,
  House,
  Instagram,
  Linkedin,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  PenSquare,
  Search,
  Settings,
  X,
  Youtube,
} from "lucide-react";
import { ROUTES } from "src/lib/routes";
import { Switch } from "@/src/components/ui/switch";
import { RoseCurveLoader } from "@/src/components/ui/rose-curve-loader";
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
  isPremium?: boolean;
}

type SettingsTab = "GENERAL" | "SOCIAL";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const interClassName = inter.className;
const smoothUiClass =
  "transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]";
const COLLAPSE_BY_DEFAULT_KEY = "socratic:sidebar:collapseByDefault";
const SHOW_HOVER_PREVIEWS_KEY = "socratic:sidebar:showHoverPreviews";
const SHOW_MODE_BADGES_KEY = "socratic:sidebar:showModeBadges";
const THEME_KEY = "socratic:theme";
const SOCRATIC_TONE_KEY = "socratic:settings:socraticTone";
const CHAT_FONT_SIZE_KEY = "socratic:chat:fontSize";

const SETTINGS_TABS: Array<{
  value: SettingsTab;
  label: string;
}> = [
  {
    value: "GENERAL",
    label: "General",
  },
  {
    value: "SOCIAL",
    label: "Social",
  },
];

const SETTINGS_TAB_META: Record<
  SettingsTab,
  { title: string; description: string; serif?: boolean }
> = {
  GENERAL: {
    title: "General",
    description: "Display and workspace preferences for your daily flow.",
    serif: true,
  },
  SOCIAL: {
    title: "Social",
    description:
      "Follow Socratic AI across platforms for news, updates & Special offers.",
  },
};

type SocialLink = {
  label: string;
  href: string;
  icon: ReactNode;
  lightIconColor: string;
  darkIconColor: string;
};

function XIcon({ className = "h-4 w-4 fill-current" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M18.9 2H21l-6.55 7.49L22 22h-5.94l-4.65-7.6L4.76 22H2.64l7.01-8.01L2 2h6.09l4.2 6.92L18.9 2Zm-1.04 18h1.64L7.2 3.9H5.44Z" />
    </svg>
  );
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/usesocratic/",
    icon: <Instagram size={16} />,
    lightIconColor: "#db2777",
    darkIconColor: "#f472b6",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@useSocraticAI",
    icon: <Youtube size={16} />,
    lightIconColor: "#dc2626",
    darkIconColor: "#f87171",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/usesocratic/",
    icon: <Linkedin size={16} />,
    lightIconColor: "#0369a1",
    darkIconColor: "#38bdf8",
  },
  {
    label: "X",
    href: "https://x.com/useSocraticAI",
    icon: <XIcon />,
    lightIconColor: "#334155",
    darkIconColor: "#f8fafc",
  },
];

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
    return "SIMPLE_CLEAR";
  }

  try {
    const value = localStorage.getItem(SOCRATIC_TONE_KEY);
    return isSocraticTone(value) ? value : "SIMPLE_CLEAR";
  } catch {
    return "SIMPLE_CLEAR";
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

export default function AppSidebar({ sessions, isPremium = false }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [collapseByDefault, setCollapseByDefault] = useState(false);
  const [showHoverPreviews, setShowHoverPreviews] = useState(true);
  const [showModeBadges, setShowModeBadges] = useState(true);
  const [socraticTone, setSocraticTone] =
    useState<SocraticTone>("SIMPLE_CLEAR");
  const [chatFontSize, setChatFontSize] = useState<ChatFontSize>("MEDIUM");
  const [activeSettingsTab, setActiveSettingsTab] =
    useState<SettingsTab>("GENERAL");
  const [isToneDropdownOpen, setIsToneDropdownOpen] = useState(false);
  const [isResetDefaultsConfirmOpen, setIsResetDefaultsConfirmOpen] =
    useState(false);
  const [showResetSuccessToast, setShowResetSuccessToast] = useState(false);
  const [isHomeNavigating, setIsHomeNavigating] = useState(false);
  const [isNewChatNavigating, setIsNewChatNavigating] = useState(false);
  const toneDropdownRef = useRef<HTMLDivElement | null>(null);
  const resetToastTimeoutRef = useRef<number | null>(null);
  const billingCtaHref = isPremium ? ROUTES.APP_BILLING : ROUTES.PRICING;
  const billingCtaLabel = isPremium ? "Socratic +" : "Upgrade to Socratic Plus";
  const activeSettingsMeta = SETTINGS_TAB_META[activeSettingsTab];

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
      const storedTone = readSocraticToneSetting();
      setSocraticTone(
        !isPremium && storedTone === "RUTHLESS_BLUNT"
          ? "SIMPLE_CLEAR"
          : storedTone,
      );
      setChatFontSize(readChatFontSizeSetting());
    });
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [isPremium]);

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

  useEffect(() => {
    if (!isHomeNavigating) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsHomeNavigating(false);
    }, 12000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isHomeNavigating]);

  useEffect(() => {
    if (!isNewChatNavigating) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsNewChatNavigating(false);
    }, 12000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isNewChatNavigating]);

  useEffect(() => {
    if (pathname === ROUTES.APP) {
      setIsNewChatNavigating(false);
    }
  }, [pathname]);

  useEffect(() => {
    const handleOpen = () => setIsMobileSidebarOpen(true);
    const handleClose = () => setIsMobileSidebarOpen(false);
    const handleToggle = () => {
      setIsMobileSidebarOpen((current) => !current);
    };

    window.addEventListener("socratic:mobile-sidebar:open", handleOpen);
    window.addEventListener("socratic:mobile-sidebar:close", handleClose);
    window.addEventListener("socratic:mobile-sidebar:toggle", handleToggle);

    return () => {
      window.removeEventListener("socratic:mobile-sidebar:open", handleOpen);
      window.removeEventListener("socratic:mobile-sidebar:close", handleClose);
      window.removeEventListener(
        "socratic:mobile-sidebar:toggle",
        handleToggle,
      );
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
    if (!isPremium && nextTone === "RUTHLESS_BLUNT") {
      setIsToneDropdownOpen(false);
      return;
    }
    setSocraticTone(nextTone);
    localStorage.setItem(SOCRATIC_TONE_KEY, nextTone);
    setIsToneDropdownOpen(false);
  }

  function openUpgradePrompt() {
    setIsToneDropdownOpen(false);
    window.dispatchEvent(new CustomEvent("socratic:upgrade-prompt:open"));
  }

  function handleSettingsTabChange(nextTab: SettingsTab) {
    setActiveSettingsTab(nextTab);
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
    handleSocraticToneChange("SIMPLE_CLEAR");
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

  function handleNewChatClick(event: ReactMouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || isNewChatNavigating) {
      return;
    }

    const isPrimaryNavigationClick =
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey;

    if (pathname !== ROUTES.APP) {
      if (!isPrimaryNavigationClick) {
        return;
      }
      setIsNewChatNavigating(true);
      return;
    }

    event.preventDefault();
    setIsNewChatNavigating(false);
    window.dispatchEvent(new CustomEvent("socratic:new-chat:requested"));
  }

  function handleHomeClick(event: ReactMouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || isHomeNavigating) {
      return;
    }

    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    setIsHomeNavigating(true);
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
            className="pointer-events-none fixed right-4 top-4 z-140"
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
        animate={{ width: collapsed ? 72 : 312 }}
        transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.9 }}
        className={`${interClassName} app-sidebar relative hidden shrink-0 overflow-visible border-r border-transparent bg-[#f9f9f9] p-2 shadow-[inset_-0.5px_0_0_rgba(0,0,0,0.10)] lg:flex lg:flex-col`}
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
          className={`app-sidebar-toggle absolute top-6.5 -right-3 z-30 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition ${
            isDarkMode
              ? "border-slate-300 bg-slate-200 text-slate-600 hover:bg-slate-300 hover:text-slate-900"
              : "border-[#e3e1d8] bg-[#eceae3] text-[#6b6a66] hover:bg-[#e2dfd6] hover:text-[#1f1f1d]"
          }`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          data-tooltip={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen size={15} />
          ) : (
            <PanelLeftClose size={15} />
          )}
        </button>

        {collapsed ? (
          <>
            <div className="mt-1 flex flex-col items-center gap-0.5">
              <Link
                href={ROUTES.APP}
                onClick={handleNewChatClick}
                className={`app-sidebar-nav-item flex h-10 w-10 items-center justify-center rounded-lg transition ${isNewChatNavigating ? "pointer-events-none opacity-90" : ""}`}
                aria-label="New chat"
              >
                {isNewChatNavigating ? (
                  <RoseCurveLoader className="h-6 w-6" />
                ) : (
                  <PenSquare size={17} />
                )}
              </Link>
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="app-sidebar-nav-item flex h-10 w-10 items-center justify-center rounded-lg transition"
                aria-label="Expand search and sidebar"
              >
                <Search size={17} />
              </button>
            </div>

            <div className="mt-auto space-y-0.5 border-t border-slate-200 pt-2">
              <Link
                href={ROUTES.HOME}
                onClick={handleHomeClick}
                className={`app-sidebar-nav-item mx-auto flex h-10 w-10 items-center justify-center rounded-lg transition ${isHomeNavigating ? "pointer-events-none opacity-90" : ""}`}
                aria-label="Home"
              >
                {isHomeNavigating ? (
                  <RoseCurveLoader className="h-8 w-8" />
                ) : (
                  <House size={17} />
                )}
              </Link>
              <Link
                href={billingCtaHref}
                target="_blank"
                rel="noreferrer noopener"
                className="app-sidebar-nav-item mx-auto flex h-10 w-10 items-center justify-center rounded-lg transition"
                aria-label={billingCtaLabel}
                data-tooltip={billingCtaLabel}
              >
                <Crown size={17} />
              </Link>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className={`app-sidebar-nav-item mx-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg ${smoothUiClass}`}
                aria-label="Settings"
              >
                <Settings size={17} />
              </button>
              <Link
                href={`${ROUTES.HOME}#contact`}
                target="_blank"
                rel="noreferrer"
                className="app-sidebar-nav-item mx-auto flex h-10 w-10 items-center justify-center rounded-lg transition"
                aria-label="Contact us"
              >
                <Mail size={17} />
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
                className={`app-sidebar-nav-item flex items-center gap-2 rounded-[14px] px-2.5 py-2 text-[14px] transition ${isNewChatNavigating ? "pointer-events-none opacity-90" : ""}`}
              >
                {isNewChatNavigating ? (
                  <RoseCurveLoader className="h-[1.05rem] w-[1.05rem]" />
                ) : (
                  <PenSquare size={16} />
                )}
                <span>New Chat</span>
              </Link>
            </div>

            <SidebarSearch />

            <div className="sidebar-scroll mt-2 min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
              <p className="mb-2 px-3 text-[11px] uppercase tracking-[0.14em] text-slate-500">
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
                onClick={handleHomeClick}
                className={`app-sidebar-nav-item flex w-full items-center gap-2 rounded-[14px] px-2.5 py-2 text-[14px] ${isHomeNavigating ? "pointer-events-none opacity-90" : ""}`}
              >
                {isHomeNavigating ? (
                  <RoseCurveLoader className="h-6 w-6" />
                ) : (
                  <House size={16} />
                )}{" "}
                Home
              </Link>
              <Link
                href={billingCtaHref}
                target="_blank"
                rel="noreferrer noopener"
                className="app-sidebar-nav-item flex w-full items-center gap-2 rounded-[14px] px-2.5 py-2 text-[14px]"
              >
                <Crown size={16} className="shrink-0" />
                {isPremium ? (
                  <span style={{ color: "#CFA43A" }}>Socratic +</span>
                ) : (
                  <span>
                    Upgrade to <span style={{ color: "#CFA43A" }}>Socratic Plus</span>
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className={`app-sidebar-nav-item flex w-full cursor-pointer items-center gap-2 rounded-[14px] px-2.5 py-2 text-[14px] ${smoothUiClass}`}
              >
                <Settings size={16} /> Settings
              </button>
              <Link
                href={`${ROUTES.HOME}#contact`}
                target="_blank"
                rel="noreferrer"
                className="app-sidebar-nav-item flex w-full items-center gap-2 rounded-[14px] px-2.5 py-2 text-[14px]"
              >
                <Mail size={16} /> Send Us a Message
              </Link>
            </div>
          </>
        )}
      </motion.aside>

      <motion.button
        type="button"
        initial={false}
        animate={{ opacity: isMobileSidebarOpen ? 1 : 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed inset-0 z-108 bg-slate-950/30 lg:hidden ${
          isMobileSidebarOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        onClick={() => setIsMobileSidebarOpen(false)}
        aria-label="Close sidebar"
        aria-hidden={!isMobileSidebarOpen}
      />

      <motion.aside
        initial={false}
        animate={{ x: isMobileSidebarOpen ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.9 }}
        style={{ willChange: "transform" }}
        className={`${interClassName} app-sidebar fixed inset-y-0 left-0 z-109 flex w-[min(92vw,400px)] transform-gpu flex-col border-r border-transparent bg-[#f9f9f9] px-3 pb-3 pt-2.5 shadow-[0_14px_34px_rgba(15,23,42,0.16)] lg:hidden`}
        aria-hidden={!isMobileSidebarOpen}
      >
        <div className="mb-2.5 flex items-center justify-between">
          <Link
            href={ROUTES.APP}
            className="flex items-center gap-2 px-0.5"
            onClick={() => setIsMobileSidebarOpen(false)}
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
            <span className="font-[Georgia,serif] text-[21px] font-normal tracking-[0.01em] text-slate-900">
              Socratic AI
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="inline-flex cursor-pointer items-center justify-center p-1 text-slate-700 transition hover:text-slate-900"
            aria-label="Close sidebar"
          >
            <PanelLeftClose size={20} />
          </button>
        </div>

        <div className="mb-2 border-t border-slate-200" />

        <div className="mb-1.5">
          <Link
            href={ROUTES.APP}
            onClick={(event) => {
              handleNewChatClick(event);
              setIsMobileSidebarOpen(false);
            }}
            className={`app-sidebar-nav-item flex items-center gap-2 rounded-[14px] px-2.5 py-2 text-[14px] transition ${isNewChatNavigating ? "pointer-events-none opacity-90" : ""}`}
          >
            {isNewChatNavigating ? (
              <RoseCurveLoader className="h-[1.05rem] w-[1.05rem]" />
            ) : (
              <PenSquare size={18} />
            )}
            <span>New Chat</span>
          </Link>
        </div>

        <SidebarSearch />

        <div className="sidebar-scroll mt-2 min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <p className="mb-2 px-2.5 text-[12px] uppercase tracking-[0.11em] text-slate-500">
            Chats
          </p>
          <SidebarSessions
            sessions={sessions}
            showHoverPreviews={showHoverPreviews}
            showModeBadges={showModeBadges}
          />
        </div>

        <div className="mt-3 space-y-1 border-t border-slate-200 pt-2.5">
          <Link
            href={ROUTES.HOME}
            onClick={(event) => {
              handleHomeClick(event);
              setIsMobileSidebarOpen(false);
            }}
            className={`app-sidebar-nav-item flex w-full items-center gap-2 rounded-[14px] px-2.5 py-2 text-[14px] ${isHomeNavigating ? "pointer-events-none opacity-90" : ""}`}
          >
            {isHomeNavigating ? (
              <RoseCurveLoader className="h-[1.05rem] w-[1.05rem]" />
            ) : (
              <House size={18} />
            )}{" "}
            Home
          </Link>
          <Link
            href={billingCtaHref}
            target="_blank"
            rel="noreferrer noopener"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="app-sidebar-nav-item flex w-full items-center gap-2 rounded-[14px] px-2.5 py-2 text-[14px]"
          >
            <Crown size={16} className="shrink-0" />
            {isPremium ? (
              <span style={{ color: "#CFA43A" }}>Socratic +</span>
            ) : (
              <span>
                Upgrade to <span style={{ color: "#CFA43A" }}>Socratic Plus</span>
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => {
              setIsSettingsOpen(true);
              setIsMobileSidebarOpen(false);
            }}
            className={`app-sidebar-nav-item flex w-full cursor-pointer items-center gap-2 rounded-[14px] px-2.5 py-2 text-[14px] ${smoothUiClass}`}
          >
            <Settings size={18} /> Settings
          </button>
          <Link
            href={`${ROUTES.HOME}#contact`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="app-sidebar-nav-item flex w-full items-center gap-2 rounded-[14px] px-2.5 py-2 text-[14px]"
          >
            <Mail size={18} /> Send Us a Message
          </Link>
        </div>
      </motion.aside>

      <AnimatePresence mode="wait" initial={false}>
        {isSettingsOpen && (
          <motion.div
            key="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed inset-0 z-120 flex items-center justify-center p-2 backdrop-blur-[2px] md:p-4 ${
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
              className={`app-card app-settings-panel relative z-121 flex h-[min(82svh,640px)] w-[min(88vw,420px)] flex-col overflow-hidden rounded-2xl border shadow-[0_22px_70px_rgba(15,23,42,0.24)] md:h-[min(520px,82vh)] md:w-[min(760px,90vw)] md:flex-row ${
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
                className={`app-settings-sidebar hidden w-46 shrink-0 border-r p-3 md:block ${
                  isDarkMode
                    ? "border-[#3d3d42] bg-[#242321]"
                    : "border-slate-200 bg-slate-50/65"
                }`}
                >
                  <p
                    className={`px-2 pb-2 text-[11px] uppercase tracking-[0.12em] ${
                      isDarkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                  >
                    Settings
                  </p>
                  <div className="space-y-1">
                    {SETTINGS_TABS.map((tab) => {
                      const isActive = activeSettingsTab === tab.value;
                      return (
                        <button
                          key={tab.value}
                          type="button"
                          onClick={() => handleSettingsTabChange(tab.value)}
                          className={`app-settings-tab-btn w-full cursor-pointer rounded-[14px] px-3 py-2 text-left text-[13px] ${smoothUiClass} ${
                            isActive
                              ? isDarkMode
                                ? "bg-[#35363a] text-slate-100"
                                : "bg-slate-200 text-slate-900"
                              : isDarkMode
                                ? "text-slate-300 hover:bg-[#2d2e32] hover:text-slate-100"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                        >
                          <span className="block">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </aside>

              <section
                className={`app-settings-content flex min-w-0 flex-1 flex-col px-5 py-5 md:px-7 md:py-6 ${
                  isDarkMode ? "bg-[#262624]" : "bg-white"
                }`}
              >
                <div>
                  <p
                    className={`text-[20px] font-medium ${
                      isDarkMode ? "text-slate-100" : "text-slate-900"
                    } ${activeSettingsMeta.serif ? "font-[Georgia,serif]" : ""}`}
                  >
                    {activeSettingsMeta.title}
                  </p>
                  <p
                    className={`mt-1 max-w-[44ch] text-[12px] ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {activeSettingsMeta.description}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5 md:hidden">
                  {SETTINGS_TABS.map((tab) => {
                    const isActive = activeSettingsTab === tab.value;
                    return (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => handleSettingsTabChange(tab.value)}
                        className={`app-settings-tab-btn rounded-[14px] px-3 py-2 text-[13px] ${smoothUiClass} ${
                          isActive
                            ? isDarkMode
                              ? "bg-[#35363a] text-slate-100"
                              : "bg-slate-200 text-slate-900"
                            : isDarkMode
                              ? "text-slate-300 hover:bg-[#2d2e32] hover:text-slate-100"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className={`app-settings-close absolute right-5 top-4 cursor-pointer rounded-full p-1.5 ${smoothUiClass} ${
                    isDarkMode
                      ? "text-slate-400 hover:bg-[#36373b] hover:text-slate-200"
                      : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  }`}
                  aria-label="Close settings"
                >
                  <X size={15} />
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
                          isDarkMode ? "border-[#444444]" : "border-[#d0d7e2]"
                        }`}
                      >
                        <div
                          className={`flex items-center justify-between gap-4 border-b py-3 ${
                            isDarkMode ? "border-[#3a3a3a]" : "border-[#d8dee7]"
                          }`}
                        >
                          <div>
                            <p
                              className={`text-[14px] ${
                                isDarkMode ? "text-slate-100" : "text-slate-800"
                              }`}
                            >
                              Theme
                            </p>
                          </div>
                          <div
                            className={`app-settings-segmented inline-flex rounded-[14px] border p-0.5 ${
                              isDarkMode
                                ? "border-[#44454a] bg-[#25262a]"
                                : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleThemePreference("light")}
                              className={`app-settings-segmented-option relative cursor-pointer overflow-hidden rounded-[14px] px-3 py-1.5 text-[13px] ${smoothUiClass} ${
                                !isDarkMode
                                  ? "text-slate-900"
                                  : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              {!isDarkMode && (
                                <motion.span
                                  layoutId="settings-theme-active-pill"
                                  className={`app-settings-segmented-pill absolute inset-0 rounded-[14px] ${
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
                              className={`app-settings-segmented-option relative cursor-pointer overflow-hidden rounded-[14px] px-3 py-1.5 text-[13px] ${smoothUiClass} ${
                                isDarkMode
                                  ? "text-slate-100"
                                  : "text-slate-500 hover:text-slate-700"
                              }`}
                            >
                              {isDarkMode && (
                                <motion.span
                                  layoutId="settings-theme-active-pill"
                                  className={`app-settings-segmented-pill absolute inset-0 rounded-[14px] ${
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
                            isDarkMode ? "border-[#3a3a3a]" : "border-[#d8dee7]"
                          }`}
                        >
                          <div>
                            <p
                              className={`text-[14px] ${
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
                            isDarkMode ? "border-[#3a3a3a]" : "border-[#d8dee7]"
                          }`}
                        >
                          <div>
                            <p
                              className={`text-[14px] ${
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
                            isDarkMode ? "border-[#3a3a3a]" : "border-[#d8dee7]"
                          }`}
                        >
                          <div>
                            <p
                              className={`text-[14px] ${
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

                        <div
                          className={`flex items-center justify-between gap-4 border-b py-3 ${
                            isDarkMode ? "border-[#3a3a3a]" : "border-[#d8dee7]"
                          }`}
                        >
                          <div>
                            <p
                              className={`text-[14px] ${
                                isDarkMode ? "text-slate-100" : "text-slate-800"
                              }`}
                            >
                              Chat text size
                            </p>
                          </div>
                          <div
                            className={`app-settings-segmented relative inline-flex rounded-[14px] border p-0.5 ${
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
                                  className={`app-settings-segmented-option relative cursor-pointer overflow-hidden rounded-[14px] px-3 py-1.5 text-[13px] ${smoothUiClass} ${
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
                                      className={`app-settings-segmented-pill absolute inset-0 rounded-[14px] ${
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
                                  <span className="relative z-10">
                                    {option.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="py-3">
                          <p
                            className={`text-[14px] ${
                              isDarkMode ? "text-slate-100" : "text-slate-800"
                            }`}
                          >
                            Tone
                          </p>
                          <p
                            className={`mt-0.5 text-[12px] ${
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
                              className={`app-settings-dropdown-trigger flex w-full cursor-pointer items-center justify-between rounded-[14px] border px-3 py-2 text-left text-[13px] ${smoothUiClass} ${
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
                                )?.label ?? "Encouraging and Supportive"}
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
                                  className={`app-settings-dropdown absolute left-0 right-0 z-20 mt-1.5 rounded-[14px] border p-1 shadow-[0_10px_30px_rgba(15,23,42,0.10)] ${
                                    isDarkMode
                                      ? "border-[#4a4b50] bg-[#2c2d32]"
                                      : "border-slate-200 bg-white"
                                  }`}
                                >
                                  {SOCRATIC_TONE_OPTIONS.map((option) => {
                                    const isLockedTone =
                                      !isPremium &&
                                      option.value === "RUTHLESS_BLUNT";
                                    return (
                                      <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                          if (isLockedTone) {
                                            openUpgradePrompt();
                                            return;
                                          }
                                          handleSocraticToneChange(option.value);
                                        }}
                                        className={`app-settings-dropdown-option w-full rounded-[14px] px-2.5 py-2 text-left ${smoothUiClass} ${
                                          socraticTone === option.value
                                            ? isDarkMode
                                              ? "bg-[#3a3b40] text-slate-100"
                                              : "bg-slate-100 text-slate-900"
                                            : isDarkMode
                                              ? "text-slate-200 hover:bg-[#35363b]"
                                              : "text-slate-700 hover:bg-slate-50"
                                        } cursor-pointer`}
                                      >
                                        <p className="inline-flex items-center gap-1.5 text-[12px] font-medium">
                                          <span>{option.label}</span>
                                          {isLockedTone ? (
                                            <Crown
                                              size={12}
                                              className="text-[#CFA43A]"
                                            />
                                          ) : null}
                                        </p>
                                        <p
                                          className={`mt-0.5 text-[11px] ${
                                            isDarkMode
                                              ? "text-slate-400"
                                              : "text-slate-500"
                                          }`}
                                        >
                                          {option.description}
                                        </p>
                                      </button>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <p
                            className={`mt-2 text-[12px] ${
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
                    ) : (
                      <motion.div
                        key="settings-social-tab"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className={`border-t ${
                          isDarkMode ? "border-[#444444]" : "border-[#d0d7e2]"
                        }`}
                      >
                        <div className="grid gap-2 py-3">
                          {SOCIAL_LINKS.map((link) => (
                            <a
                              key={link.label}
                              href={link.href}
                              target="_blank"
                              rel="noreferrer noopener"
                              className={`group flex items-center justify-between rounded-[14px] border px-3 py-2.5 ${smoothUiClass} ${
                                isDarkMode
                                  ? "border-[#3b3c40] bg-[#242529] hover:border-[#4a4b50] hover:bg-[#2b2c30]"
                                  : "border-[#d8dee7] bg-white hover:border-[#cbd4df] hover:bg-[#f8fafc]"
                              }`}
                            >
                              <span className="inline-flex items-center gap-2.5">
                                <span
                                  className="inline-flex h-8.5 w-8.5 items-center justify-center"
                                  style={{
                                    color: isDarkMode
                                      ? link.darkIconColor
                                      : link.lightIconColor,
                                  }}
                                >
                                  {link.icon}
                                </span>
                                <span
                                  className={`text-[13px] font-medium ${
                                    isDarkMode ? "text-slate-100" : "text-slate-900"
                                  }`}
                                >
                                  {link.label}
                                </span>
                              </span>
                              <ArrowUpRight
                                size={15}
                                className={`shrink-0 ${smoothUiClass} ${
                                  isDarkMode
                                    ? "text-slate-500 group-hover:text-slate-200"
                                    : "text-slate-400 group-hover:text-slate-700"
                                }`}
                              />
                            </a>
                          ))}
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
                    className={`app-settings-secondary-btn cursor-pointer rounded-[14px] border px-3 py-2 text-[13px] ${smoothUiClass} ${
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
                    className={`app-settings-primary-btn cursor-pointer rounded-[14px] px-3 py-2 text-[13px] text-white ${smoothUiClass} ${
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
                      className={`absolute inset-0 z-130 flex items-center justify-center p-4 ${
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
                        className={`app-card w-full max-w-85 rounded-xl border p-4 ${
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
                          Reset all settings to default?
                        </p>

                        <div className="mt-4 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setIsResetDefaultsConfirmOpen(false)}
                            className={`app-settings-secondary-btn cursor-pointer rounded-[14px] border px-3 py-2 text-[13px] ${smoothUiClass} ${
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
                            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-[14px] bg-rose-600 px-3 py-2 text-[13px] text-white hover:bg-rose-700 ${smoothUiClass}`}
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

