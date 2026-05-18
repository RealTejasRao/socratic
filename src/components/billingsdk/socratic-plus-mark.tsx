"use client";

import { cn } from "@/src/lib/utils";
import { PremiumCrownIcon } from "@/src/components/billingsdk/premium-crown-icon";

type SocraticPlusMarkProps = {
  className?: string;
  textClassName?: string;
  iconClassName?: string;
};

export function SocraticPlusMark({
  className,
  textClassName,
  iconClassName,
}: SocraticPlusMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("text-[#b8860b]", textClassName)}>Socratic +</span>
      <PremiumCrownIcon className={cn("h-[1em] w-[1em]", iconClassName)} />
    </span>
  );
}
