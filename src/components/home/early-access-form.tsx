"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { Gift } from "lucide-react";
import confetti from "canvas-confetti";
import { Instrument_Serif } from "next/font/google";
import { createPortal } from "react-dom";
import {
  HOME_HERO_EMAIL_FOCUS_EVENT,
  HOME_HERO_EMAIL_INPUT_ID,
  HOME_HERO_HASH,
} from "@/src/lib/home-hero";

type FormStatus = {
  tone: "idle" | "error" | "success";
  message: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
});

type EarlyAccessFormProps = {
  theme?: "dark" | "light";
  variant?: "card" | "inlineHero";
};

function launchConfetti() {
  const durationMs = 2200;
  const animationEnd = Date.now() + durationMs;

  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      window.clearInterval(interval);
      return;
    }

    confetti({
      particleCount: 45,
      startVelocity: 30,
      spread: 70,
      origin: { x: 0.12, y: 0.65 },
      zIndex: 140,
      disableForReducedMotion: true,
    });

    confetti({
      particleCount: 45,
      startVelocity: 30,
      spread: 70,
      origin: { x: 0.88, y: 0.65 },
      zIndex: 140,
      disableForReducedMotion: true,
    });
  }, 260);
}

export default function EarlyAccessForm({
  theme = "dark",
  variant = "card",
}: EarlyAccessFormProps) {
  const isLight = theme === "light";
  const isInlineHero = variant === "inlineHero";
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGiftPopup, setShowGiftPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");
  const [isHeroInputHighlighted, setIsHeroInputHighlighted] = useState(false);
  const [status, setStatus] = useState<FormStatus>({
    tone: "idle",
    message: "",
  });
  const heroInputRef = useRef<HTMLInputElement | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);
  const canUseDOM = typeof window !== "undefined" && typeof document !== "undefined";

  useEffect(() => {
    if (!isInlineHero) return;

    const triggerHeroInputHighlight = () => {
      if (highlightTimeoutRef.current !== null) {
        window.clearTimeout(highlightTimeoutRef.current);
      }

      setIsHeroInputHighlighted(false);
      window.requestAnimationFrame(() => {
        setIsHeroInputHighlighted(true);
      });

      highlightTimeoutRef.current = window.setTimeout(() => {
        setIsHeroInputHighlighted(false);
        highlightTimeoutRef.current = null;
      }, 850);
    };

    const focusHeroInput = () => {
      const input = heroInputRef.current;
      if (!input) return;

      input.focus();
      const caretPosition = input.value.length;
      input.setSelectionRange(caretPosition, caretPosition);
    };

    const onRequestFocus = () => {
      focusHeroInput();
      window.setTimeout(focusHeroInput, 160);
      triggerHeroInputHighlight();
    };

    if (window.location.hash === HOME_HERO_HASH) {
      onRequestFocus();
    }

    window.addEventListener(HOME_HERO_EMAIL_FOCUS_EVENT, onRequestFocus);
    return () => {
      window.removeEventListener(HOME_HERO_EMAIL_FOCUS_EVENT, onRequestFocus);
      if (highlightTimeoutRef.current !== null) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [isInlineHero]);

  const showError = (message: string) => {
    setStatus({
      tone: "error",
      message,
    });

    if (isInlineHero) {
      setPopupErrorMessage(message);
      setShowErrorPopup(true);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      showError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setShowErrorPopup(false);
    setPopupErrorMessage("");
    setStatus({ tone: "idle", message: "" });

    try {
      const response = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      let data: { message?: string } = {};
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        data = (await response.json()) as { message?: string };
      }

      if (response.status === 409) {
        showError(data.message ?? "This email is already registered.");
        return;
      }

      if (!response.ok) {
        showError(data.message ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus({
        tone: "success",
        message: data.message ?? "Try Socratic AI now.",
      });
      setEmail("");
      setShowGiftPopup(true);
      launchConfetti();
    } catch {
      showError("Unable to submit right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusClassName =
    status.tone === "error"
      ? isLight
        ? "text-red-700"
        : "text-red-300"
      : status.tone === "success"
        ? isLight
          ? "text-emerald-700"
          : "text-emerald-300"
        : isLight
          ? "text-slate-700/90"
          : "text-slate-300/85";

  const inputClassName = isLight
    ? "h-12 w-full rounded-2xl border border-slate-300/80 bg-white/92 px-4 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_10px_20px_rgba(148,163,184,0.2)] outline-none placeholder:text-slate-500 focus:border-orange-400/70 focus:bg-white focus:ring-2 focus:ring-orange-300/45"
    : "h-12 w-full rounded-2xl border border-white/24 bg-black/40 px-4 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_24px_rgba(0,0,0,0.35)] outline-none placeholder:text-slate-300/65 focus:border-orange-300/55 focus:bg-black/52 focus:ring-2 focus:ring-orange-300/35";
  const inlineHeroInputClassName =
    "h-[3.35rem] w-full border-0 bg-[#f7f4ee] px-4 text-[1.2rem] text-black shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] outline-none placeholder:text-[1.2rem] placeholder:text-black/58 focus:bg-white sm:h-12 sm:px-5 sm:text-[1.15rem]";

  const overlayClassName = isLight
    ? "fixed inset-0 z-[180] grid place-items-center bg-black/35 px-4 py-6 backdrop-blur-sm transition-all duration-300 ease-out"
    : "fixed inset-0 z-[180] grid place-items-center bg-black/55 px-4 py-6 backdrop-blur-sm transition-all duration-300 ease-out";

  const modalClassName = isLight
    ? "w-full max-w-2xl max-h-[calc(100svh-1.5rem)] overflow-y-auto rounded-[2rem] border border-[#d7c19f] bg-[#fffaf1] px-5 py-5 text-center shadow-[0_30px_80px_rgba(15,23,42,0.35)] transition-all duration-300 ease-out sm:px-8 sm:py-7"
    : "w-full max-w-2xl max-h-[calc(100svh-1.5rem)] overflow-y-auto rounded-[2rem] border border-amber-100/20 bg-slate-950 px-5 py-5 text-center shadow-[0_30px_80px_rgba(0,0,0,0.62)] transition-all duration-300 ease-out sm:px-8 sm:py-7";

  const errorModalClassName = isLight
    ? "w-full max-w-xl rounded-[1.75rem] border border-red-300/80 bg-white p-6 text-center shadow-[0_24px_64px_rgba(127,29,29,0.22)] transition-all duration-300 ease-out sm:p-8"
    : "w-full max-w-xl rounded-[1.75rem] border border-red-300/35 bg-slate-950 p-6 text-center shadow-[0_24px_64px_rgba(0,0,0,0.6)] transition-all duration-300 ease-out sm:p-8";

  const popupLabelClassName = isLight
    ? "text-sm font-semibold tracking-[0.14em] text-emerald-700 uppercase"
    : "text-sm font-semibold tracking-[0.14em] text-emerald-300 uppercase";

  const popupHeadingClassName = isLight
    ? `${instrumentSerif.className} mt-2.5 text-[clamp(2rem,7svh,3.4rem)] leading-[1.02] text-slate-950`
    : `${instrumentSerif.className} mt-2.5 text-[clamp(2rem,7svh,3.4rem)] leading-[1.02] text-white`;

  const popupCopyClassName = isLight
    ? "mx-auto mt-3 max-w-xl text-[clamp(1rem,2.7svh,1.2rem)] leading-relaxed text-slate-700"
    : "mx-auto mt-3 max-w-xl text-[clamp(1rem,2.7svh,1.2rem)] leading-relaxed text-slate-200/90";

  const errorLabelClassName = isLight
    ? "text-sm font-semibold tracking-[0.14em] text-red-700 uppercase"
    : "text-sm font-semibold tracking-[0.14em] text-red-300 uppercase";

  const errorCopyClassName = isLight
    ? "mx-auto mt-4 max-w-lg text-[1rem] leading-relaxed text-slate-800 sm:text-[1.16rem]"
    : "mx-auto mt-4 max-w-lg text-[1rem] leading-relaxed text-slate-100 sm:text-[1.16rem]";

  const popupCloseClassName = isLight
    ? "relative z-10 mt-5 inline-flex h-11 min-w-36 cursor-pointer items-center justify-center rounded-full border border-black/15 bg-black px-7 text-base font-medium text-white transition-all duration-300 ease-out hover:bg-black/88"
    : "relative z-10 mt-5 inline-flex h-11 min-w-36 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 px-7 text-base font-medium text-white transition-all duration-300 ease-out hover:bg-white/16";

  const renderOverlay = (content: ReactNode) => {
    if (!canUseDOM) {
      return null;
    }

    return createPortal(content, document.body);
  };

  return (
    <>
      <form
        noValidate
        onSubmit={onSubmit}
        className={isInlineHero ? "relative mt-1.5 w-full max-w-2xl sm:mt-2" : "relative mt-5 space-y-3"}
      >
        {isInlineHero ? (
          <div
            className={`flex w-full flex-col overflow-hidden rounded-none border-2 border-black bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08)] sm:flex-row ${
              isHeroInputHighlighted ? "hero-email-input-highlight" : ""
            }`}
          >
            <input
              id={HOME_HERO_EMAIL_INPUT_ID}
              ref={heroInputRef}
              type="text"
              name="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              aria-invalid={status.tone === "error"}
              className={inlineHeroInputClassName}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[3.35rem] w-full cursor-pointer border-t-2 border-black bg-[#A01717] px-4 text-[1.5rem] font-medium tracking-[0.01em] text-white transition-colors duration-200 enabled:hover:bg-[#870f0f] disabled:cursor-not-allowed disabled:opacity-70 sm:h-12 sm:w-auto sm:min-w-46 sm:border-t-0 sm:border-l-2 sm:px-5 sm:text-[1.1rem]"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="loading-spinner loading-spinner-light" aria-hidden="true" />
                  <span className="inline-flex items-center">
                    Hold on
                    <span className="loading-dots" aria-hidden="true">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </span>
                  </span>
                </span>
              ) : (
                "Try Socratic AI Now"
              )}
            </button>
          </div>
        ) : (
          <>
            <input
              type="text"
              name="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              aria-invalid={status.tone === "error"}
              className={inputClassName}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full cursor-pointer rounded-2xl bg-linear-to-r from-orange-500 via-amber-500 to-rose-500 text-sm font-semibold tracking-[0.01em] text-black shadow-[0_14px_30px_rgba(251,146,60,0.36),inset_0_1px_0_rgba(255,255,255,0.42)] transition-all duration-300 ease-out enabled:hover:-translate-y-0.5 enabled:hover:brightness-110 enabled:hover:shadow-[0_20px_36px_rgba(251,146,60,0.42),inset_0_1px_0_rgba(255,255,255,0.48)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="loading-spinner" aria-hidden="true" />
                  <span className="inline-flex items-center">
                    Hold on
                    <span className="loading-dots" aria-hidden="true">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </span>
                  </span>
                </span>
              ) : (
                "Reserve my spot"
              )}
            </button>
          </>
        )}

        {isInlineHero ? (
          status.message && status.tone !== "error" ? (
            <p
              className={`mt-3 text-center text-xs transition-colors duration-300 ease-out ${statusClassName}`}
            >
              {status.message}
            </p>
          ) : null
        ) : (
          <p className={`text-center text-xs transition-colors duration-300 ease-out ${statusClassName}`}>
            {status.message || "No spam. Just one email when access opens."}
          </p>
        )}
      </form>

      {showErrorPopup
        ? renderOverlay(
          <div className={overlayClassName}>
            <div className={errorModalClassName}>
              <p className={errorLabelClassName}>
                Submission error
              </p>
              <p className={errorCopyClassName}>
                {popupErrorMessage}
              </p>
              <button
                type="button"
                onClick={() => setShowErrorPopup(false)}
                className={popupCloseClassName}
              >
                Close
              </button>
            </div>
          </div>
        )
        : null}

      {showGiftPopup
        ? renderOverlay(
          <div className={overlayClassName}>
            <div className={modalClassName}>
              <p className={popupLabelClassName}>
                Added successfully
              </p>
              <h3 className={popupHeadingClassName}>
                You&apos;re on the list
              </h3>
              <p className={popupCopyClassName}>
                Tap the gift to open your surprise and start using Socratic AI now.
              </p>
              <a
                href="https://youtu.be/QDia3e12czc?si=VmG8elzvdKkMvZT4"
                target="_blank"
                rel="noreferrer"
                className="gift-cta group relative mx-auto mt-5 mb-1 flex h-[min(15rem,34svh)] w-[min(15rem,34svh)] cursor-pointer items-center justify-center rounded-full bg-linear-to-br from-amber-200 via-orange-100 to-rose-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_18px_46px_rgba(217,119,6,0.36)] transition-all duration-300 ease-out hover:scale-105 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_22px_50px_rgba(217,119,6,0.42)] sm:h-[min(18rem,40svh)] sm:w-[min(18rem,40svh)]"
                aria-label="Open your gift"
              >
                <Gift
                  aria-hidden="true"
                  className="h-[min(6.5rem,14svh)] w-[min(6.5rem,14svh)] text-amber-600 drop-shadow-[0_4px_10px_rgba(146,64,14,0.35)] sm:h-[min(8rem,17svh)] sm:w-[min(8rem,17svh)]"
                  strokeWidth={2.25}
                />
                <span className="pointer-events-none absolute -right-2 -top-2 text-4xl text-amber-500">
                  ✨
                </span>
              </a>
              <button
                type="button"
                onClick={() => setShowGiftPopup(false)}
                className={popupCloseClassName}
              >
                Close
              </button>
            </div>
          </div>
        )
        : null}

      <style jsx>{`
        .loading-spinner {
          height: 0.9rem;
          width: 0.9rem;
          border-radius: 9999px;
          border: 2px solid rgba(0, 0, 0, 0.25);
          border-top-color: rgba(0, 0, 0, 0.95);
          animation: buttonSpin 0.75s linear infinite;
        }

        .loading-spinner-light {
          border: 2px solid rgba(255, 255, 255, 0.45);
          border-top-color: rgba(255, 255, 255, 0.98);
        }

        .loading-dots {
          display: inline-flex;
          width: 1.05rem;
          justify-content: flex-start;
        }

        .loading-dots span {
          opacity: 0.22;
          animation: dotPulse 1s ease-in-out infinite;
        }

        .loading-dots span:nth-child(2) {
          animation-delay: 0.16s;
        }

        .loading-dots span:nth-child(3) {
          animation-delay: 0.32s;
        }

        .gift-cta {
          animation: giftShake 1.05s ease-in-out infinite;
          transform-origin: center;
        }

        @keyframes buttonSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes dotPulse {
          0%,
          80%,
          100% {
            opacity: 0.22;
          }
          40% {
            opacity: 1;
          }
        }

        @keyframes giftShake {
          0%,
          100% {
            transform: rotate(0deg);
          }
          15% {
            transform: rotate(-7deg);
          }
          30% {
            transform: rotate(7deg);
          }
          45% {
            transform: rotate(-6deg);
          }
          60% {
            transform: rotate(6deg);
          }
          75% {
            transform: rotate(-3deg);
          }
        }

        .hero-email-input-highlight {
          animation: heroInputFocusPulse 0.75s cubic-bezier(0.22, 1, 0.36, 1);
          transform-origin: center;
          will-change: transform, box-shadow;
        }

        @keyframes heroInputFocusPulse {
          0% {
            transform: scale(1);
            box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
          }
          35% {
            transform: scale(1.018);
            box-shadow:
              0 0 0 4px rgba(160, 23, 23, 0.22),
              0 14px 28px rgba(160, 23, 23, 0.2);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-email-input-highlight {
            animation: none;
            box-shadow:
              0 0 0 4px rgba(160, 23, 23, 0.2),
              0 8px 18px rgba(15, 23, 42, 0.08);
          }
        }
      `}</style>

      <style jsx global>{`
        canvas.canvas-confetti {
          pointer-events: none !important;
        }
      `}</style>
    </>
  );
}
