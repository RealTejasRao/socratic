"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/src/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-[background-color,box-shadow] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-slate-900 data-[state=unchecked]:bg-slate-300 focus-visible:ring-2 focus-visible:ring-ring/70 data-[state=checked]:shadow-[0_1px_6px_rgba(15,23,42,0.25)]",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(15,23,42,0.25)] ring-0 transition-[transform,box-shadow] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 data-[state=checked]:shadow-[0_2px_6px_rgba(2,6,23,0.35)]"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
