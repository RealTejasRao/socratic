"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Bell, House, MessageCircle, Settings } from "lucide-react";
import { useStandaloneMode } from "@/src/hooks/use-standalone-mode";
import { ROUTES } from "@/src/lib/routes";

type NavItem = {
  href: Route;
  label: string;
  isActive: boolean;
  icon: ReactNode;
};

function matchPath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PwaBottomNav() {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const isStandalone = useStandaloneMode();
  const hideOnSignedOutHome = pathname === ROUTES.HOME && isSignedIn === false;
  const shouldShowNav = isStandalone && !hideOnSignedOutHome;

  useEffect(() => {
    if (!shouldShowNav) {
      document.body.classList.remove("pwa-bottom-nav-active");
      return;
    }

    document.body.classList.add("pwa-bottom-nav-active");
    return () => {
      document.body.classList.remove("pwa-bottom-nav-active");
    };
  }, [shouldShowNav]);

  if (!shouldShowNav) {
    return null;
  }

  const items: NavItem[] = [
    {
      href: ROUTES.HOME,
      label: "Home",
      isActive: matchPath(pathname, ROUTES.HOME),
      icon: <House size={18} />,
    },
    {
      href: ROUTES.APP,
      label: "Chat",
      isActive: matchPath(pathname, ROUTES.APP),
      icon: <MessageCircle size={18} />,
    },
    {
      href: ROUTES.NOTIFICATIONS,
      label: "Notifications",
      isActive: matchPath(pathname, ROUTES.NOTIFICATIONS),
      icon: <Bell size={18} />,
    },
    {
      href: ROUTES.SETTINGS_APP,
      label: "Settings",
      isActive: matchPath(pathname, ROUTES.SETTINGS_APP),
      icon: <Settings size={18} />,
    },
  ];

  return (
    <nav className="pwa-bottom-nav fixed inset-x-4 bottom-[calc(0.45rem+env(safe-area-inset-bottom))] z-120 rounded-[1rem] border border-white/12 bg-[#060709]/95 shadow-[0_14px_36px_rgba(0,0,0,0.48)] backdrop-blur-md">
      <ul className="mx-auto grid h-[4.35rem] max-w-[28rem] grid-cols-4 items-end px-2.5 pb-2 pt-2">
        {items.map((item) => (
          <li key={item.href} className="flex justify-center">
            <Link
              href={item.href}
              className={`inline-flex w-full max-w-[5rem] flex-col items-center justify-center gap-0.5 rounded-[0.7rem] px-1.5 py-1.5 transition-colors ${
                item.isActive
                  ? "text-[#ff5f69]"
                  : "text-white/52 hover:bg-white/6 hover:text-white/82"
              }`}
              aria-label={item.label}
            >
              <span>{item.icon}</span>
              <span className="text-[0.72rem] font-medium tracking-[0.01em]">
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
