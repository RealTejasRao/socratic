"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, Search, X } from "lucide-react";

type SearchResult = {
  id: string;
  title: string;
  snippet: string;
  matchType: "title" | "message";
};

function highlightQuery(text: string, query: string) {
  if (!query.trim()) {
    return text;
  }

  const normalizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const segments = text.split(new RegExp(`(${normalizedQuery})`, "ig"));

  return segments.map((segment, index) => {
    if (segment.toLowerCase() === query.toLowerCase()) {
      return (
        <mark
          key={`${segment}-${index}`}
          className="app-search-highlight rounded-sm bg-emerald-100 px-px text-emerald-900"
        >
          {segment}
        </mark>
      );
    }

    return <span key={`${segment}-${index}`}>{segment}</span>;
  });
}

export default function SidebarSearch() {
  const pathname = usePathname();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const requestIdRef = useRef(0);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        wrapperRef.current?.contains(event.target as Node) ||
        panelRef.current?.contains(event.target as Node)
      ) {
        return;
      }

      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function handleFocusIn(event: FocusEvent) {
      if (
        wrapperRef.current?.contains(event.target as Node) ||
        panelRef.current?.contains(event.target as Node)
      ) {
        return;
      }

      setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/v1/chat/sessions/search?q=${encodeURIComponent(normalizedQuery)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          if (requestId === requestIdRef.current) {
            setResults([]);
          }
          return;
        }

        const data = (await response.json()) as SearchResult[];
        if (requestId === requestIdRef.current) {
          setResults(data);
        }
      } catch {
        if (requestId === requestIdRef.current) {
          setResults([]);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [open, query]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setIsLoading(false);
    }
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative mb-2">
      <div className="h-9 lg:h-9">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute inset-x-0 top-0 flex h-9 cursor-pointer items-center gap-2 rounded-[14px] px-2.5 py-2 text-[14px] text-black/90 transition-all duration-200 hover:bg-white/70 hover:text-black lg:h-9 lg:gap-2 lg:rounded-[14px] lg:px-2.5 lg:py-2 lg:text-[14px]"
        >
          <Search size={15} className="lg:h-[15px] lg:w-[15px]" />
          <span>Search chats</span>
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {open && (
          <motion.div
            key="search-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="app-sidebar-search-backdrop fixed inset-0 z-50 bg-slate-950/16 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          >
            <motion.div
              key="search-panel"
              initial={{ opacity: 0, y: 14, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.985 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              ref={panelRef}
              onClick={(event) => event.stopPropagation()}
              className="app-card app-sidebar-search-modal absolute left-1/2 top-1/2 flex max-h-[min(560px,82vh)] w-[min(760px,90vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-[0_22px_70px_rgba(15,23,42,0.24)]"
            >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="app-sidebar-search-title text-[13px] font-medium text-slate-900">
                  Search chats
                </p>
                <p className="app-sidebar-search-subtitle mt-0.5 text-[10px] text-slate-500">
                  Search titles and message content.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="app-sidebar-search-close inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close search"
              >
                <X size={14} />
              </button>
            </div>

            <div className="relative">
              <Search
                size={14}
                className="app-sidebar-search-input-icon pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search through your chats"
                autoComplete="off"
                spellCheck={false}
                className="app-sidebar-search-input h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
              />
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
              {!query.trim() ? (
                <div className="app-sidebar-search-state rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-center text-[11px] leading-5 text-slate-500">
                  Start typing to search titles and message content.
                </div>
              ) : isLoading ? (
                <div className="app-sidebar-search-state rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-5 text-center text-[11px] text-slate-500">
                  Searching...
                </div>
              ) : results.length === 0 ? (
                <div className="app-sidebar-search-state rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-5 text-center text-[11px] leading-5 text-slate-500">
                  No matching chats found.
                </div>
              ) : (
                <div className="space-y-2">
                  {results.map((result) => (
                    <Link
                      key={result.id}
                      href={`/app/${result.id}`}
                      className="app-card app-sidebar-search-result block rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50/60"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="app-sidebar-search-result-title line-clamp-1 text-[12px] font-medium text-slate-900">
                          {highlightQuery(result.title, query)}
                        </p>
                        {result.matchType === "message" && (
                          <span className="app-sidebar-search-result-badge inline-flex items-center gap-1 rounded-full bg-sky-50 px-1.5 py-0.5 text-[9px] text-sky-700">
                            <Globe size={9} />
                            In chat
                          </span>
                        )}
                      </div>
                      <p className="app-sidebar-search-result-snippet mt-1.5 line-clamp-2 text-[11px] leading-4.5 text-slate-500">
                        {highlightQuery(result.snippet, query)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
