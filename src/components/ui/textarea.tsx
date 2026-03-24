"use client";

import * as React from "react";

import { cn } from "@/src/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-3xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-foreground shadow-[0_18px_50px_rgba(16,24,40,0.08)] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground/80 focus-visible:border-accent/70 focus-visible:ring-4 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
