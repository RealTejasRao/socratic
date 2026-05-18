"use client";

import { Crown } from "lucide-react";
import { cn } from "@/src/lib/utils";

type PremiumCrownIconProps = {
  className?: string;
  crownClassName?: string;
};

export function PremiumCrownIcon({
  className,
  crownClassName,
}: PremiumCrownIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "premium-crown-icon relative inline-flex h-[0.8em] w-[0.8em] -translate-y-[0.04em] items-center justify-center rounded-full align-middle",
        className,
      )}
    >
      <span className="premium-crown-icon-core absolute inset-0 rounded-full" />
      <span className="premium-crown-icon-aura absolute -inset-[0.22em] rounded-full" />
      <span className="premium-crown-icon-sheen absolute inset-0 rounded-full" />
      <Crown
        className={cn("h-[0.52em] w-[0.52em] text-white", crownClassName)}
        strokeWidth={2.2}
      />
    </span>
  );
}
