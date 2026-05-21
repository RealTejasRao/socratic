"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
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
  const pathname = usePathname();
  const isStandalone = useStandaloneMode();

  useEffect(() => {
    if (!isStandalone) {
      document.body.classList.remove("pwa-bottom-nav-active");
      return;
    }

    document.body.classList.add("pwa-bottom-nav-active");
    return () => {
      document.body.classList.remove("pwa-bottom-nav-active");
    };
  }, [isStandalone]);

  if (!isStandalone) {
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
    <nav className="pwa-bottom-nav fixed inset-x-0 bottom-0 z-120 border-t border-white/12 bg-[#060709]/96 backdrop-blur-md">
      <ul className="mx-auto grid h-18 max-w-96 grid-cols-4 items-end px-3 pb-[calc(0.4rem+env(safe-area-inset-bottom))] pt-2">
        {items.map((item) => (
          <li key={item.href} className="flex justify-center">
            <Link
              href={item.href}
              className={`inline-flex w-full max-w-18 flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 py-1.5 transition-colors ${
                item.isActive
                  ? "text-[#ff5f69]"
                  : "text-white/52 hover:bg-white/6 hover:text-white/82"
              }`}
              aria-label={item.label}
            >
              <span>{item.icon}</span>
              <span className="text-[0.7rem] font-medium tracking-[0.02em]">
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
