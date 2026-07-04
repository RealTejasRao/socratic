"use client";

import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { ROUTES } from "@/src/lib/routes";
import { cn } from "@/src/lib/utils";

interface Props {
  size?: "sm" | "md";
}

export default function AppUserButton({ size = "md" }: Props) {
  const [isMounted, setIsMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => {
      setIsDarkMode(root.classList.contains("app-dark"));
    };

    syncTheme();
    const timeoutId = window.setTimeout(() => {
      setIsMounted(true);
    }, 0);

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      window.clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  const triggerClassName =
    size === "sm"
      ? cn(
          "!h-[28px] !w-[28px] shadow-[0_6px_18px_rgba(15,23,42,0.06)]",
          isDarkMode
            ? "border border-slate-700 bg-slate-900"
            : "border border-slate-200 bg-white",
        )
      : cn(
          "!h-[36px] !w-[36px] shadow-[0_6px_18px_rgba(15,23,42,0.06)]",
          isDarkMode
            ? "border border-slate-700 bg-slate-900"
            : "border border-slate-200 bg-white",
        );
  const avatarClassName =
    size === "sm" ? "!h-[28px] !w-[28px]" : "!h-[36px] !w-[36px]";

  if (!isMounted) {
    return (
      <div
        className={
          size === "sm"
            ? "h-7 w-7 rounded-full border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)]"
            : "h-9 w-9 rounded-full border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)]"
        }
      />
    );
  }

  return (
    <UserButton
      afterSignOutUrl={ROUTES.HOME}
      appearance={{
        elements: {
          userButtonTrigger: triggerClassName,
          userButtonAvatarBox: avatarClassName,
        },
      }}
    />
  );
}
