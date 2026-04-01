"use client";

import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

interface Props {
  size?: "sm" | "md";
}

export default function AppUserButton({ size = "md" }: Props) {
  const [isMounted, setIsMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const root = document.documentElement;
    const syncTheme = () => {
      setIsDarkMode(root.classList.contains("app-dark"));
    };

    syncTheme();

    const observer = new MutationObserver(() => {
      syncTheme();
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  if (!isMounted) {
    return null;
  }

  const triggerClassName =
    size === "sm"
      ? "!h-[28px] !w-[28px] border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)]"
      : "!h-[34px] !w-[34px] border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)]";
  const avatarClassName =
    size === "sm" ? "!h-[28px] !w-[28px]" : "!h-[34px] !w-[34px]";

  return (
    <UserButton
      key={isDarkMode ? "clerk-user-dark" : "clerk-user-light"}
      appearance={{
        baseTheme: isDarkMode ? dark : undefined,
        elements: {
          userButtonTrigger: triggerClassName,
          userButtonAvatarBox: avatarClassName,
        },
      }}
      userProfileProps={{
        appearance: {
          baseTheme: isDarkMode ? dark : undefined,
        },
      }}
    />
  );
}
