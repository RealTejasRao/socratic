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

  return (
    <aside
      className={`${poppinsClassName} relative hidden shrink-0 border-r border-transparent bg-white p-2 shadow-[inset_-1px_0_0_rgba(0,0,0,0.10)] transition-[width] duration-300 ease-out lg:flex lg:flex-col ${
        collapsed ? "w-[58px]" : "w-[248px]"
      }`}
    >
      <div
        className={`mb-2 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}
      >
        <Link
          href={ROUTES.APP}
          className={collapsed ? "flex items-center justify-center" : "flex items-center gap-2 px-1"}
        >
          <Image
            src={resolveCloudinaryPublicAsset("/brand/Logo_Dark_SVG.svg")}
            alt="Socratic AI logo"
            width={24}
            height={24}
            className="h-5 w-5 shrink-0 object-contain"
            priority
          />
          {!collapsed && (
            <span className="text-[17px] tracking-wider font-normal  text-slate-900 [font-family:Georgia,serif]">
              Socratic AI
            </span>
          )}
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setCollapsed((current) => !current)}
        className="absolute top-[44px] -right-3 z-20 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-slate-600 transition hover:bg-slate-300 hover:text-slate-900"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
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
              className="flex items-center gap-1.5 rounded-lg px-2 py-[5px] text-[12px] text-black/90 transition hover:bg-white/70 hover:text-black"
            >
              <PenSquare size={12} />
              <span>New Chat</span>
            </Link>
          </div>

          <SidebarSearch />

          <div className="sidebar-scroll mt-2 min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <p className="mb-1.5 px-2 text-[9px] uppercase tracking-[0.18em] text-slate-400">
              Chats
            </p>
            <SidebarSessions sessions={sessions} />
          </div>

          <div className="mt-3 space-y-0.5 border-t border-slate-200 pt-2">
            <Link
              href={ROUTES.HOME}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-[5px] text-[12px] text-black/90 hover:bg-white/70 hover:text-black"
            >
              <House size={12} /> Home
            </Link>
            <button className="flex w-full items-center gap-2 rounded-lg px-2 py-[5px] text-[12px] text-black/90 hover:bg-white/70 hover:text-black">
              <Settings size={12} /> Settings
            </button>
            <Link
              href={`${ROUTES.HOME}#contact`}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-[5px] text-[12px] text-black/90 hover:bg-white/70 hover:text-black"
            >
              <Mail size={12} /> Send Us a Message
            </Link>
          </div>
        </>
      )}
    </aside>
  );
}
