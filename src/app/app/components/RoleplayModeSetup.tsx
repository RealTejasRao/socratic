"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type MotionStyle,
} from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, Search, X } from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  ROLEPLAY_FLAIRS,
  ROLEPLAY_FLAIR_THEMES,
  ROLEPLAY_PHILOSOPHERS,
  type RoleplayFlair,
  type RoleplayPhilosopherId,
} from "src/lib/roleplay";

interface Props {
  onChatNow: (philosopherId: RoleplayPhilosopherId) => void;
  startingPhilosopherId?: RoleplayPhilosopherId | null;
}

const ROLEPLAY_LIBRARY_ORDER: RoleplayPhilosopherId[] = [
  "MACHIAVELLI",
  "MARCUS_AURELIUS",
  "DOSTOEVSKY",
  "NIETZSCHE",
  "SOCRATES",
  "ARISTOTLE",
  "PLATO",
  "KANT",
  "FREUD",
  "CAMUS",
  "SARTRE",
  "ADAM_SMITH",
  "ROUSSEAU",
  "HOBBES",
  "HUME",
  "MILL",
  "SPINOZA",
  "SENECA",
  "SCHOPENHAUER",
  "KIERKEGAARD",
  "THOREAU",
  "EPICTETUS",
  "WILLIAM_JAMES",
  "AL_GHAZALI",
];

const roleplayLibraryRank = new Map(
  ROLEPLAY_LIBRARY_ORDER.map((id, index) => [id, index]),
);

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getFlairStyle(flair: RoleplayFlair | "All") {
  const theme = ROLEPLAY_FLAIR_THEMES[flair];

  return {
    "--roleplay-flair-bg": theme.background,
    "--roleplay-flair-border": theme.border,
  } as CSSProperties;
}

export default function RoleplayModeSetup({
  onChatNow,
  startingPhilosopherId = null,
}: Props) {
  const [query, setQuery] = useState("");
  const [selectedFlair, setSelectedFlair] = useState<RoleplayFlair | "All">(
    "All",
  );
  const [isFiltering, setIsFiltering] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const flairRailRef = useRef<HTMLDivElement>(null);
  const filteringTimeoutRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    return () => {
      if (filteringTimeoutRef.current !== null) {
        window.clearTimeout(filteringTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    flairRailRef.current?.scrollTo({
      left: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [selectedFlair, prefersReducedMotion]);

  const filteredPhilosophers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return ROLEPLAY_PHILOSOPHERS.filter((philosopher) => {
      const matchesFlair =
        selectedFlair === "All" ||
        (philosopher.flairs as readonly RoleplayFlair[]).includes(
          selectedFlair,
        );
      if (!matchesFlair) return false;

      if (!normalizedQuery) return true;

      const searchable = [
        philosopher.name,
        philosopher.shortName,
        philosopher.expertise,
        philosopher.shortDescription,
        philosopher.bestFor,
        ...philosopher.flairs,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    }).sort((first, second) => {
      const firstRank = roleplayLibraryRank.get(first.id) ?? Number.MAX_SAFE_INTEGER;
      const secondRank =
        roleplayLibraryRank.get(second.id) ?? Number.MAX_SAFE_INTEGER;

      return firstRank - secondRank;
    });
  }, [query, selectedFlair]);

  const filterFlairs = useMemo<(RoleplayFlair | "All")[]>(() => {
    if (selectedFlair === "All") {
      return ["All", ...ROLEPLAY_FLAIRS];
    }

    return [
      "All",
      selectedFlair,
      ...ROLEPLAY_FLAIRS.filter((flair) => flair !== selectedFlair),
    ];
  }, [selectedFlair]);

  function markImageFailed(id: string) {
    setFailedImages((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }

  function showFilteringState() {
    if (prefersReducedMotion) {
      return;
    }

    if (filteringTimeoutRef.current !== null) {
      window.clearTimeout(filteringTimeoutRef.current);
    }

    setIsFiltering(true);
    filteringTimeoutRef.current = window.setTimeout(() => {
      setIsFiltering(false);
      filteringTimeoutRef.current = null;
    }, 180);
  }

  function scrollFlairs(direction: "left" | "right") {
    flairRailRef.current?.scrollBy({
      left: direction === "left" ? -280 : 280,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  return (
    <section className="app-roleplay-library mx-auto flex w-full max-w-300 flex-col px-0 pb-8">
      <div className="app-roleplay-library-header mx-auto w-full max-w-235 text-left">
        <h2 className="app-roleplay-heading text-[28px] leading-none tracking-[-0.04em] text-slate-950 font-[Georgia,serif] md:text-[36px]">
          Some conversations change how you think forever.
        </h2>
        <p className="app-roleplay-muted mt-2 max-w-170 text-[13px] leading-5 text-slate-500">
          Every philosopher here spent their life building a way of seeing. This
          is your chance to borrow it, not through textbooks, but through real
          back-and-forth conversation.
        </p>
      </div>

      <div className="app-roleplay-controls mx-auto mt-5 w-full max-w-235">
        <div className="app-roleplay-search relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(event) => {
              showFilteringState();
              setQuery(event.target.value);
            }}
            placeholder="Search philosopher name, school or category..."
            className="app-roleplay-search-input w-full rounded-[14px] border px-11 py-3 text-[14px] outline-none transition"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                showFilteringState();
                setQuery("");
              }}
              className="app-roleplay-search-clear absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 cursor-pointer place-items-center rounded-full transition"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        <div className="app-roleplay-flair-shell mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollFlairs("left")}
            className="app-roleplay-flair-arrow grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-[10px] border transition"
            aria-label="Scroll flairs left"
          >
            <ChevronLeft size={21} />
          </button>

          <div
            ref={flairRailRef}
            className="app-roleplay-flair-row flex min-w-0 flex-1 gap-2 overflow-x-auto px-0.5 py-2"
          >
            {filterFlairs.map((flair) => (
              <button
                key={flair}
                type="button"
                onClick={() => {
                  showFilteringState();
                  setSelectedFlair(flair);
                }}
                data-active={selectedFlair === flair}
                data-flair={flair}
                className="app-roleplay-flair-token app-roleplay-flair-filter inline-flex shrink-0 cursor-pointer items-center rounded-[8px] border px-3.5 py-2 text-[13px] leading-none transition"
                style={getFlairStyle(flair)}
              >
                {flair}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollFlairs("right")}
            className="app-roleplay-flair-arrow grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-[10px] border transition"
            aria-label="Scroll flairs right"
          >
            <ChevronRight size={21} />
          </button>
        </div>
      </div>

      <div className="app-roleplay-results mx-auto mt-5 w-full max-w-285">
        <AnimatePresence mode="wait">
          {isFiltering ? (
            <motion.div
              key="roleplay-loading"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
              aria-label="Loading philosophers"
            >
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="app-roleplay-card-skeleton overflow-hidden rounded-[16px] border"
                >
                  <div className="app-roleplay-skeleton-media aspect-[16/10]" />
                  <div className="p-4">
                    <div className="app-roleplay-skeleton-line h-6 w-31 rounded-[9px]" />
                    <div className="app-roleplay-skeleton-line mt-4 h-7 w-38 rounded-[8px]" />
                    <div className="app-roleplay-skeleton-line mt-3 h-4 w-full rounded-[8px]" />
                    <div className="app-roleplay-skeleton-line mt-2 h-4 w-4/5 rounded-[8px]" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : filteredPhilosophers.length ? (
            <motion.div
              key={`roleplay-grid-${selectedFlair}-${query.trim().toLowerCase()}`}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
            >
              {filteredPhilosophers.map((philosopher, index) => {
                const imageFailed = failedImages.has(philosopher.id);
                const primaryFlairTheme =
                  ROLEPLAY_FLAIR_THEMES[philosopher.flairs[0]];

                return (
                  <motion.article
                    key={philosopher.id}
                    initial={
                      prefersReducedMotion
                        ? false
                        : { opacity: 0, y: 12, scale: 0.98 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{
                      duration: 0.24,
                      delay: prefersReducedMotion ? 0 : Math.min(index, 10) * 0.025,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="app-roleplay-character-card group relative flex min-h-0 cursor-default flex-col overflow-hidden rounded-[16px] border text-left transition"
                    style={
                      {
                        "--roleplay-accent": philosopher.accent,
                        "--roleplay-primary-flair": primaryFlairTheme.background,
                      } as CSSProperties as MotionStyle
                    }
                  >
                    <div className="app-roleplay-card-media relative aspect-[16/10] w-full shrink-0 overflow-hidden">
                      {imageFailed ? (
                        <div className="app-roleplay-fallback-portrait grid h-full place-items-center">
                          <span>{getInitials(philosopher.name)}</span>
                        </div>
                      ) : (
                        <>
                          <Image
                            src={philosopher.imagePath}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                            className="app-roleplay-card-image-backdrop object-cover"
                            aria-hidden="true"
                          />
                          <Image
                            src={philosopher.imagePath}
                            alt={`${philosopher.name} portrait`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                            className="app-roleplay-card-image-main object-cover transition duration-500 group-hover:scale-[1.045]"
                            onError={() => markImageFailed(philosopher.id)}
                          />
                        </>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col p-4">
                      <div className="flex min-h-5 flex-wrap gap-1.5">
                        {philosopher.flairs.slice(0, 2).map((flair) => (
                          <span
                            key={flair}
                            data-flair={flair}
                            className="app-roleplay-flair-token app-roleplay-flair-badge rounded-[8px] border px-3.5 py-2 text-[13px] leading-none"
                            style={getFlairStyle(flair)}
                          >
                            {flair}
                          </span>
                        ))}
                      </div>

                      <h3 className="app-roleplay-heading mt-3 text-[23px] leading-[1.02] tracking-[-0.035em] font-[Georgia,serif]">
                        {philosopher.name}
                      </h3>
                      <p className="app-roleplay-card-copy mt-3 line-clamp-3 text-[13px] leading-5.5">
                        {philosopher.shortDescription}
                      </p>

                      <button
                        type="button"
                        onClick={() => onChatNow(philosopher.id)}
                        disabled={Boolean(startingPhilosopherId)}
                        className="app-roleplay-start-now mt-4 inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[12px] px-3.5 py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed"
                      >
                        {startingPhilosopherId === philosopher.id ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : null}
                        <span>
                          {startingPhilosopherId === philosopher.id
                            ? "Opening..."
                            : "Start now"}
                        </span>
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="roleplay-empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={cn(
                "app-roleplay-empty rounded-[16px] border px-5 py-10 text-center",
              )}
            >
              <p className="app-roleplay-heading text-[18px] font-[Georgia,serif]">
                No philosopher found.
              </p>
              <p className="app-roleplay-muted mt-2 text-[12px]">
                Try a school, a name, or a problem like power, anxiety, freedom,
                or morality.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
