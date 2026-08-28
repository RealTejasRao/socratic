"use client";

import { useEffect, useState } from "react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Scale,
  Landmark,
  MessageSquareText,
  PenLine,
  Swords,
  X,
} from "lucide-react";
import type { UpscDailyChallenge } from "./daily-challenges";

const UPSC_APP_PATH = "/upsc/app" as Route;
const DAILY_CHALLENGE_STORAGE_KEY = "socratic:upsc:daily-challenge-started";
const QUICK_TOUR_STORAGE_KEY = "socratic:app-quick-tour:v1";

type Props = {
  challenge: UpscDailyChallenge | null;
  userStorageId: string | null;
};

function getStorageKey(dateKey: string) {
  return `${DAILY_CHALLENGE_STORAGE_KEY}:${dateKey}`;
}

function getQuickTourStorageKey(userId: string) {
  return `${QUICK_TOUR_STORAGE_KEY}:${userId}`;
}

function formatChallengeDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${dateKey}T00:00:00.000Z`));
}

function renderCategoryIcon(category: string) {
  const iconProps = {
    size: 52,
    strokeWidth: 1.35,
  };

  switch (category.toLowerCase().trim()) {
    case "ethics":
      return <Scale {...iconProps} />;
    case "gs":
      return <Landmark {...iconProps} />;
    case "essay thinking":
      return <PenLine {...iconProps} />;
    case "interview":
      return <MessageSquareText {...iconProps} />;
    case "debate":
      return <Swords {...iconProps} />;
    default:
      return <BookOpen {...iconProps} />;
  }
}

export default function UpscDailyChallengeModal({
  challenge,
  userStorageId,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [rootNavigationCount, setRootNavigationCount] = useState(0);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const currentPathname = window.location.pathname;
      const currentSearchParams = new URLSearchParams(window.location.search);

      if (!challenge || !userStorageId || currentPathname !== UPSC_APP_PATH) {
        setIsOpen(false);
        setIsStarting(false);
        return;
      }

      if (currentSearchParams.get("autosend") === "1") {
        setIsOpen(false);
        return;
      }

      try {
        const hasCompletedQuickTour =
          localStorage.getItem(getQuickTourStorageKey(userStorageId)) ===
          "complete";

        if (!hasCompletedQuickTour) {
          setIsOpen(false);
          return;
        }

        setIsOpen(
          localStorage.getItem(getStorageKey(challenge.dateKey)) !== "1",
        );
      } catch {
        setIsOpen(true);
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [challenge, pathname, rootNavigationCount, searchParams, userStorageId]);

  useEffect(() => {
    if (!challenge || !userStorageId) {
      return;
    }

    const intervalId = window.setInterval(() => {
      try {
        if (
          window.location.pathname === UPSC_APP_PATH &&
          localStorage.getItem(getQuickTourStorageKey(userStorageId)) ===
            "complete"
        ) {
          setRootNavigationCount((current) => current + 1);
          window.clearInterval(intervalId);
        }
      } catch {
        window.clearInterval(intervalId);
      }
    }, 500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [challenge, userStorageId]);

  useEffect(() => {
    function handleRootNavigation() {
      setRootNavigationCount((current) => current + 1);
    }

    window.addEventListener(
      "socratic:upsc-app-root:navigated",
      handleRootNavigation,
    );

    return () => {
      window.removeEventListener(
        "socratic:upsc-app-root:navigated",
        handleRootNavigation,
      );
    };
  }, []);

  function handleClose() {
    setIsOpen(false);
  }

  async function handleStart() {
    if (!challenge || isStarting) {
      return;
    }

    setIsStarting(true);

    try {
      const response = await fetch("/upsc/app/daily-challenge", {
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as {
        sessionId?: string;
      } | null;

      if (!response.ok || !payload?.sessionId) {
        setIsStarting(false);
        return;
      }

      try {
        localStorage.setItem(getStorageKey(challenge.dateKey), "1");
      } catch {
        // The challenge has already started even if storage is unavailable.
      }

      setIsOpen(false);
      router.push(`${UPSC_APP_PATH}/${payload.sessionId}` as Route, {
        scroll: false,
      });
    } catch {
      setIsStarting(false);
    }
  }

  if (!challenge) {
    return null;
  }

  const formattedDate = formatChallengeDate(challenge.dateKey);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-140 flex items-center justify-center bg-[#10151d]/38 px-4 py-6 backdrop-blur-[4px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          role="presentation"
          onClick={handleClose}
        >
          <motion.div
            className="relative w-full max-w-128 overflow-hidden rounded-[18px] border border-[#202a35] bg-[#fbfaf6] shadow-[0_28px_90px_rgba(9,14,22,0.34)]"
            initial={{ opacity: 0, y: 22, scale: 0.965 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Daily UPSC challenge"
            onClick={(event) => event.stopPropagation()}
          >
            <motion.div
              className="absolute bottom-0 left-0 top-0 w-1.5 bg-[#d99027]"
              initial={{ scaleY: 0, transformOrigin: "top" }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />

            <button
              type="button"
              onClick={handleClose}
              className="absolute right-3 top-3 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#7b8087] transition hover:bg-[#edf0f2] hover:text-[#17202a]"
              aria-label="Close daily challenge"
            >
              <X size={16} />
            </button>

            <div className="grid min-h-82 gap-0 md:grid-cols-[0.54fr_1fr]">
              <div className="flex flex-col justify-between bg-[#151d26] px-5 py-6 text-[#f7f2e7] sm:px-6 md:py-7">
                <motion.div
                  className="inline-flex text-[#d99027]"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.08,
                    duration: 0.34,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {renderCategoryIcon(challenge.category)}
                </motion.div>

                <div>
                  <p className="text-[12px] font-medium text-[#f7f2e7]">
                    Today&apos;s challenge
                  </p>
                  <p className="mt-1 text-[13px] leading-6 text-[#aab3bd]">
                    {formattedDate}
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-between px-5 py-6 pr-12 sm:px-8 sm:py-8">
                <motion.div
                  className="text-[14px] font-medium tracking-normal text-[#59616b]"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.12,
                    duration: 0.28,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {challenge.category}
                </motion.div>

                <div className="py-8 sm:py-10">
                  <p className="text-[25px] leading-[1.12] tracking-[-0.025em] text-[#18212b] font-[Georgia,serif] sm:text-[31px]">
                    {challenge.question}
                  </p>
                </div>

                <div className="flex flex-col gap-2 border-t border-[#e5e2da] pt-5 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={handleStart}
                    disabled={isStarting}
                    className="group relative inline-flex h-11 cursor-pointer items-center justify-center overflow-hidden rounded-[13px] bg-[#17202a] px-4 text-[14px] font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="absolute inset-0 -translate-x-full bg-[#d99027] transition-transform duration-900 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-x-0" />
                    <span className="relative z-10 inline-flex items-center gap-2">
                      {isStarting ? "Starting..." : "Start now"}
                      <ArrowRight
                        size={16}
                        className="transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-x-0.5"
                      />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex h-11 cursor-pointer items-center justify-center rounded-[13px] px-4 text-[13px] font-medium text-[#6e747c] transition hover:bg-[#eef0f1] hover:text-[#17202a]"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
