"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
import SidebarSearch from "./SidebarSearch";
import SidebarSessions from "./SidebarSessions";

interface Session {
  id: string;
  title: string | null;
}

interface Props {
  sessions: Session[];
}

export default function AppSidebar({ sessions }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`relative hidden shrink-0 border-r border-slate-200/90 bg-[#eef0f5] p-3 transition-[width] duration-300 ease-out lg:flex lg:flex-col ${
        collapsed ? "w-[72px]" : "w-[230px]"
      }`}
    >
      <div className={`mb-3 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        {collapsed ? (
          <div className="flex flex-col items-center">
            <Link href={ROUTES.APP} className="flex items-center justify-center">
              <Image
                src="/brand/Logo_Dark.png"
                alt="Socratic AI logo"
                width={26}
                height={26}
                className="h-[26px] w-[26px] object-contain"
                priority
              />
            </Link>
          </div>
        ) : (
          <>
            <Link href={ROUTES.APP} className="flex items-center gap-2 px-1.5">
              <Image
                src="/brand/Logo_Dark.png"
                alt="Socratic AI logo"
                width={26}
                height={26}
                className="h-[26px] w-[26px] object-contain"
                priority
              />
              <span className="text-lg font-semibold tracking-tight text-slate-900">
                Socratic AI
              </span>
            </Link>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => setCollapsed((current) => !current)}
        className="absolute top-1/2 -right-4 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition hover:text-slate-900"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </button>

      {collapsed ? (
        <>
          <div className="mt-2 flex flex-col items-center gap-1">
            <Link
              href={ROUTES.APP}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white/70 hover:text-slate-900"
              aria-label="New chat"
            >
              <PenSquare size={16} />
            </Link>
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white/70 hover:text-slate-900"
              aria-label="Expand search and sidebar"
            >
              <Search size={16} />
            </button>
          </div>

          <div className="mt-auto space-y-1 border-t border-slate-200 pt-3">
            <Link
              href={ROUTES.HOME}
              className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white/70 hover:text-slate-900"
              aria-label="Home"
            >
              <House size={16} />
            </Link>
            <button
              type="button"
              className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white/70 hover:text-slate-900"
              aria-label="Settings"
            >
              <Settings size={16} />
            </button>
            <Link
              href={`${ROUTES.HOME}#contact`}
              target="_blank"
              rel="noreferrer"
              className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white/70 hover:text-slate-900"
              aria-label="Contact us"
            >
              <Mail size={16} />
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="mb-1 mt-2">
            <Link
              href={ROUTES.APP}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-white/70 hover:text-slate-900"
            >
              <PenSquare size={15} />
              <span>New Chat</span>
            </Link>
          </div>

          <SidebarSearch />

          <div className="mt-2 min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <p className="mb-2 px-2 text-xs uppercase tracking-[0.14em] text-slate-400">Chats</p>
            <SidebarSessions sessions={sessions} />
          </div>

          <div className="mt-3 space-y-1 border-t border-slate-200 pt-3">
            <Link
              href={ROUTES.HOME}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-1.5 text-sm text-slate-600 hover:bg-white/70 hover:text-slate-900"
            >
              <House size={15} /> Home
            </Link>
            <button className="flex w-full items-center gap-3 rounded-lg px-2.5 py-1.5 text-sm text-slate-600 hover:bg-white/70 hover:text-slate-900">
              <Settings size={15} /> Settings
            </button>
            <Link
              href={`${ROUTES.HOME}#contact`}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-1.5 text-sm text-slate-600 hover:bg-white/70 hover:text-slate-900"
            >
              <Mail size={15} /> Contact Us
            </Link>
          </div>
        </>
      )}
    </aside>
  );
}
