"use client";

import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";

interface Props {
  size?: "sm" | "md";
}

export default function AppUserButton({ size = "md" }: Props) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsMounted(true);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const triggerClassName =
    size === "sm"
      ? "!h-[28px] !w-[28px] border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)]"
      : "!h-[34px] !w-[34px] border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)]";
  const avatarClassName =
    size === "sm" ? "!h-[28px] !w-[28px]" : "!h-[34px] !w-[34px]";

  if (!isMounted) {
    return (
      <div
        className={
          size === "sm"
            ? "h-[28px] w-[28px] rounded-full border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)]"
            : "h-[34px] w-[34px] rounded-full border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)]"
        }
      />
    );
  }

  return (
    <UserButton
      appearance={{
        elements: {
          userButtonTrigger: triggerClassName,
          userButtonAvatarBox: avatarClassName,
        },
      }}
    />
  );
}
