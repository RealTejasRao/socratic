"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Bell, House, MessageCircle, Settings } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { PremiumCrownIcon } from "@/src/components/billingsdk/premium-crown-icon";
import { useStandaloneMode } from "@/src/hooks/use-standalone-mode";
import { ROUTES } from "@/src/lib/routes";
import type { BillingStateResponse } from "@/src/types/billing";

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
  const { isSignedIn } = useUser();
  const isStandalone = useStandaloneMode();
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (!isStandalone || !isSignedIn) {
      return;
    }

    let cancelled = false;

    const loadBillingState = async () => {
      try {
        const response = await fetch("/api/v1/billing/state", {
          method: "GET",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as BillingStateResponse;
        if (!cancelled) {
          setIsPremium(payload.isPremium);
        }
      } catch {
        if (!cancelled) {
          setIsPremium(false);
        }
      }
    };

    void loadBillingState();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, isStandalone]);

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

  const premiumHref = isSignedIn && isPremium ? ROUTES.APP_BILLING : ROUTES.PRICING;
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
      href: premiumHref,
      label: "Socratic+",
      isActive: matchPath(pathname, premiumHref),
      icon: (
        <PremiumCrownIcon
          className="h-8 w-8"
          crownClassName="h-[1em] w-[1em]"
        />
      ),
    },
    {
      href: ROUTES.NOTIFICATIONS,
      label: "Alerts",
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
    <nav className="pwa-bottom-nav fixed inset-x-0 bottom-0 z-120 border-t border-black/12 bg-white/96 backdrop-blur-md">
      <ul className="mx-auto grid h-18 max-w-96 grid-cols-5 items-end px-2 pb-[calc(0.4rem+env(safe-area-inset-bottom))] pt-2">
        {items.map((item, index) => (
          <li key={item.href} className="flex justify-center">
            <Link
              href={item.href}
              className={`inline-flex w-full max-w-15 flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 py-1.5 transition-colors ${
                item.isActive
                  ? "text-black"
                  : "text-black/45 hover:bg-black/4 hover:text-black/72"
              }`}
              aria-label={item.label}
            >
              <span className={index === 2 ? "-mt-1" : ""}>{item.icon}</span>
              <span className="text-[0.66rem] font-medium tracking-[0.02em]">
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
