"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";

export default function SidebarSearch() {
  const [expanded, setExpanded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!expanded) return;
    inputRef.current?.focus();
  }, [expanded]);

  function collapseIfOutsideFocus() {
    const nextFocused = document.activeElement;
    if (!wrapperRef.current?.contains(nextFocused)) {
      setExpanded(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative mb-3 h-8">
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className={cn(
          "absolute inset-0 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-slate-600 transition-all duration-200 hover:bg-white/70 hover:text-slate-900",
          expanded && "pointer-events-none -translate-y-1 opacity-0",
        )}
      >
        <Search size={15} />
        <span>Search</span>
      </button>

      <div
        className={cn(
          "absolute inset-0 transition-all duration-200",
          expanded ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0",
        )}
      >
        <div className="relative h-full">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-slate-400"
          />
          <Input
            ref={inputRef}
            placeholder="Search chats"
            className="h-8 pl-8 pr-3 text-xs"
            onBlur={collapseIfOutsideFocus}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setExpanded(false);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
