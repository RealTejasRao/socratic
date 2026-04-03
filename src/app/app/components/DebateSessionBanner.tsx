"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Clock3,
  Crown,
  ScrollText,
  Swords,
} from "lucide-react";
import {
  formatDebateCountdown,
  getDebateDurationMeta,
  getDebateToneMeta,
} from "src/lib/debate";
import type { ChatSessionMeta } from "src/types/chat";

interface Props {
  sessionMeta: ChatSessionMeta;
  onFinalize: (nextMeta: ChatSessionMeta) => void;
}

export default function DebateSessionBanner({ sessionMeta, onFinalize }: Props) {
  const debate = sessionMeta.debate;
  const [showSummary, setShowSummary] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const finalizeRequestedRef = useRef(false);

  const durationMeta = debate
    ? getDebateDurationMeta(debate.durationPreset)
    : null;
  const toneMeta = debate ? getDebateToneMeta(debate.tone) : null;
  const remainingSeconds = (() => {
    if (
      !debate?.hasTimer ||
      !debate.startedAt ||
      !durationMeta?.minutes ||
      nowMs === null
    ) {
      return null;
    }

    const endsAt =
      new Date(debate.startedAt).getTime() + durationMeta.minutes * 60 * 1000;

    return Math.max(0, Math.ceil((endsAt - nowMs) / 1000));
  })();

  const winnerLabel = (() => {
    if (!debate?.winner) {
      return null;
    }

    if (debate.winner === "USER") {
      return "You";
    }

    if (debate.winner === "ASSISTANT") {
      return "Socratic AI";
    }

    return "Draw";
  })();

  useEffect(() => {
    if (!debate?.hasTimer || !debate.startedAt || !durationMeta?.minutes) {
      return;
    }

    const syncTimeoutId = window.setTimeout(() => {
      setNowMs(Date.now());
    }, 0);

    const updateCountdown = () => {
      setNowMs(Date.now());
    };

    const intervalId = window.setInterval(updateCountdown, 1000);

    return () => {
      window.clearTimeout(syncTimeoutId);
      window.clearInterval(intervalId);
    };
  }, [debate?.hasTimer, debate?.startedAt, durationMeta?.minutes]);

  useEffect(() => {
    if (
      !debate ||
      debate.status === "COMPLETED" ||
      !debate.hasTimer ||
      remainingSeconds === null ||
      remainingSeconds > 0 ||
      finalizeRequestedRef.current
    ) {
      return;
    }

    finalizeRequestedRef.current = true;
    window.setTimeout(() => {
      setIsFinalizing(true);
    }, 0);

    fetch("/api/v1/chat/debates/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionMeta.id }),
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        const payload = (await response.json()) as {
          debateStatus: "COMPLETED";
          debateEndedAt: string;
          debateWinner: "USER" | "ASSISTANT" | "DRAW" | null;
          debateVerdictSummary: string | null;
          debateSummary: string | null;
        };

        onFinalize({
          ...sessionMeta,
          status: "CLOSED",
          debate: debate
            ? {
                ...debate,
                status: payload.debateStatus,
                endedAt: payload.debateEndedAt,
                winner: payload.debateWinner,
                verdictSummary: payload.debateVerdictSummary,
                summary: payload.debateSummary,
              }
            : null,
        });
      })
      .finally(() => {
        setIsFinalizing(false);
      });
  }, [debate, onFinalize, remainingSeconds, sessionMeta]);

  if (!debate) {
    return null;
  }

  return (
    <div className="sticky top-0 z-20 mb-5 overflow-hidden rounded-[28px] border border-[#d9d2c4] bg-[linear-gradient(135deg,#fdf9f0_0%,#f4ecdd_52%,#efe5d4_100%)] p-5 shadow-[0_20px_60px_rgba(23,18,11,0.08)]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-[720px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d0c6b2] bg-white/70 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#756a52]">
              <Swords size={12} />
              Debate
            </div>
            <h2 className="mt-4 text-[28px] leading-[1.04] tracking-[-0.05em] text-[#17120b] [font-family:Georgia,serif] md:text-[40px]">
              {debate.topic}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-700">
              <span className="rounded-full border border-[#d9d2c4] bg-white/80 px-3 py-1.5">
                {toneMeta?.label}
              </span>
              <span className="rounded-full border border-[#d9d2c4] bg-white/80 px-3 py-1.5">
                {durationMeta?.label}
              </span>
              <span className="rounded-full border border-[#d9d2c4] bg-white/80 px-3 py-1.5">
                You: {debate.userSide}
              </span>
              <span className="rounded-full border border-[#d9d2c4] bg-white/80 px-3 py-1.5">
                AI: {debate.aiSide}
              </span>
            </div>
          </div>

          {debate.hasTimer ? (
            <div className="min-w-[168px] rounded-[24px] border border-[#cabd9f] bg-[#17120b] px-4 py-3 text-white shadow-[0_16px_30px_rgba(23,18,11,0.22)]">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/56">
                <Clock3 size={12} />
                Timer
              </div>
              <p className="mt-2 text-[30px] leading-none tracking-[-0.05em] [font-family:Georgia,serif]">
                {remainingSeconds === null
                  ? "--:--"
                  : formatDebateCountdown(remainingSeconds)}
              </p>
              <p className="mt-2 text-[11px] leading-5 text-white/68">
                {debate.status === "COMPLETED"
                  ? "Debate finished."
                  : isFinalizing
                    ? "Finalizing verdict..."
                    : "When the clock ends, the debate closes permanently."}
              </p>
            </div>
          ) : (
            <div className="min-w-[168px] rounded-[24px] border border-[#d9d2c4] bg-white/70 px-4 py-3 text-left">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Format
              </p>
              <p className="mt-2 text-[24px] leading-none tracking-[-0.05em] text-[#17120b] [font-family:Georgia,serif]">
                Untimed
              </p>
              <p className="mt-2 text-[11px] leading-5 text-slate-600">
                Long-form debate without a countdown.
              </p>
            </div>
          )}
        </div>

        {debate.status === "COMPLETED" && (
          <div className="rounded-[24px] border border-[#dbcdb0] bg-white/72 px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#17120b] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white">
                  <Crown size={12} />
                  Winner: {winnerLabel}
                </div>
                <p className="mt-3 max-w-[760px] text-[13px] leading-6 text-slate-700">
                  {debate.verdictSummary}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSummary((current) => !current)}
                className="inline-flex items-center gap-2 rounded-full border border-[#d9d2c4] bg-white px-3.5 py-2 text-[11px] text-slate-700 transition hover:border-[#b6ac98] hover:text-slate-950"
              >
                <ScrollText size={13} />
                Show summary
                {showSummary ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>

            <AnimatePresence initial={false}>
              {showSummary && debate.summary && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 rounded-[20px] border border-[#e2d8c5] bg-[#fbf7ef] px-4 py-3 text-[13px] leading-6 text-slate-700">
                    {debate.summary}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {debate.status !== "COMPLETED" && (
          <p className="text-[12px] leading-6 text-slate-600">
            Keep your replies tight and thesis-driven. When the debate ends, the
            transcript stays, but the session closes.
          </p>
        )}
      </div>
    </div>
  );
}
