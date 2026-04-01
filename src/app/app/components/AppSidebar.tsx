"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  House,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  PenSquare,
  Search,
  Settings,
} from "lucide-react";
import { ROUTES } from "src/lib/routes";
import { resolveCloudinaryPublicAsset } from "@/src/lib/cloudinary-public-assets";
import SidebarSearch from "./SidebarSearch";
import SidebarSessions from "./SidebarSessions";

interface Session {
  id: string;
  title: string | null;
  firstMessagePreview: string | null;
}

interface Props {
  sessions: Session[];
}

const poppinsClassName = "[font-family:Poppins,sans-serif]";

export default function AppSidebar({ sessions }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  return (
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
          <Image
            src={resolveCloudinaryPublicAsset(
              isDarkMode ? "/brand/Logo_Light.png" : "/brand/Logo_Dark_SVG.svg",
            )}
            alt="Socratic AI logo"
            width={30}
            height={30}
            className="h-7 w-7 shrink-0 object-contain"
            priority
          />
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
        className="app-sidebar-toggle absolute top-[26px] -right-3 z-30 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-slate-600 transition hover:bg-slate-300 hover:text-slate-900"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        data-tooltip={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
      </button>

      {collapsed ? (
        <>
          <div className="mt-1 flex flex-col items-center gap-0.5">
            <Link
              href={ROUTES.APP}
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
              className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg text-black transition hover:bg-white/70 hover:text-black"
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
          <div className="mb-1 mt-1">
            <Link
              href={ROUTES.APP}
              className="flex items-center gap-1.5 rounded-lg px-2 py-[5px] text-[11px] text-black/90 transition hover:bg-white/70 hover:text-black"
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
            <SidebarSessions sessions={sessions} />
          </div>

          <div className="mt-3 space-y-0.5 border-t border-slate-200 pt-2">
            <Link
              href={ROUTES.HOME}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-[5px] text-[11px] text-black/90 hover:bg-white/70 hover:text-black"
            >
              <House size={12} /> Home
            </Link>
            <button className="flex w-full items-center gap-2 rounded-lg px-2 py-[5px] text-[11px] text-black/90 hover:bg-white/70 hover:text-black">
              <Settings size={12} /> Settings
            </button>
            <Link
              href={`${ROUTES.HOME}#contact`}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-[5px] text-[11px] text-black/90 hover:bg-white/70 hover:text-black"
            >
              <Mail size={12} /> Send Us a Message
            </Link>
          </div>
        </>
      )}
    </motion.aside>
  );
}
