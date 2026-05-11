"use client";

import { FormEvent, useState } from "react";
import { Gift } from "lucide-react";
import confetti from "canvas-confetti";
import { Instrument_Serif } from "next/font/google";

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
  const [status, setStatus] = useState<FormStatus>({
    tone: "idle",
    message: "",
  });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setStatus({
        tone: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    setIsSubmitting(true);
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
        setStatus({
          tone: "error",
          message: data.message ?? "This email is already registered.",
        });
        return;
      }

      if (!response.ok) {
        setStatus({
          tone: "error",
          message: data.message ?? "Something went wrong. Please try again.",
        });
        return;
      }

      setStatus({
        tone: "success",
        message: data.message ?? "You are on the early access list.",
      });
      setEmail("");
      setShowGiftPopup(true);
      launchConfetti();
    } catch {
      setStatus({
        tone: "error",
        message: "Unable to submit right now. Please try again.",
      });
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
    "h-13 w-full border-0 bg-white px-4 text-[0.95rem] text-black outline-none placeholder:text-black/45 sm:h-14 sm:px-6 sm:text-[1.5rem]";

  const overlayClassName = isLight
    ? "fixed inset-0 z-120 flex items-center justify-center bg-[#f8fafc]/72 p-4 backdrop-blur-sm transition-all duration-300 ease-out"
    : "fixed inset-0 z-120 flex items-center justify-center bg-[#0f172a]/45 p-4 backdrop-blur-sm transition-all duration-300 ease-out";

  const modalClassName = isLight
    ? "w-full max-w-sm rounded-2xl border border-slate-300/70 bg-white/96 p-5 text-center shadow-[0_24px_64px_rgba(148,163,184,0.34)] transition-all duration-300 ease-out"
    : "w-full max-w-sm rounded-2xl border border-white/22 bg-slate-950/88 p-5 text-center shadow-[0_24px_64px_rgba(0,0,0,0.5)] transition-all duration-300 ease-out";

  const popupLabelClassName = isLight
    ? "text-[11px] font-medium tracking-[0.08em] text-emerald-700 uppercase"
    : "text-[11px] font-medium tracking-[0.08em] text-emerald-300 uppercase";

  const popupHeadingClassName = isLight
    ? `${instrumentSerif.className} mt-1.5 text-3xl leading-tight text-slate-950`
    : `${instrumentSerif.className} mt-1.5 text-3xl leading-tight text-white`;

  const popupCloseClassName = isLight
    ? "relative z-10 mt-2 flex h-10 w-full cursor-pointer items-center justify-center rounded-lg text-xs text-slate-600 underline-offset-2 transition-all duration-300 ease-out hover:text-slate-950 hover:underline"
    : "relative z-10 mt-2 flex h-10 w-full cursor-pointer items-center justify-center rounded-lg text-xs text-slate-300 underline-offset-2 transition-all duration-300 ease-out hover:text-white hover:underline";

  return (
    <>
      <form
        noValidate
        onSubmit={onSubmit}
        className={isInlineHero ? "relative mt-2 w-full max-w-3xl sm:mt-2.5" : "relative mt-5 space-y-3"}
      >
        {isInlineHero ? (
          <div className="flex w-full overflow-hidden rounded-none border-2 border-black bg-white">
            <input
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
              className="h-13 min-w-[9.5rem] cursor-pointer border-l-2 border-black bg-[#A01717] px-4 text-[0.9rem] font-medium tracking-[0.01em] text-white transition-colors duration-200 enabled:hover:bg-[#870f0f] disabled:cursor-not-allowed disabled:opacity-70 sm:h-14 sm:min-w-[13rem] sm:px-7 sm:text-[1.5rem]"
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
                "Get Early Access"
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
          status.message ? (
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

      {showGiftPopup ? (
        <div className={overlayClassName}>
          <div className={modalClassName}>
            <p className={popupLabelClassName}>
              Added successfully
            </p>
            <h3 className={popupHeadingClassName}>
              Here is a gift for you
            </h3>
            <a
              href="https://youtu.be/QDia3e12czc?si=VmG8elzvdKkMvZT4"
              target="_blank"
              rel="noreferrer"
              className="gift-cta group relative mx-auto mt-5 mb-3 flex h-32 w-32 cursor-pointer items-center justify-center rounded-full bg-linear-to-br from-amber-200 via-orange-100 to-rose-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_34px_rgba(217,119,6,0.34)] transition-all duration-300 ease-out hover:scale-105 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_18px_40px_rgba(217,119,6,0.4)]"
              aria-label="Open your gift"
            >
              <Gift
                aria-hidden="true"
                className="h-20 w-20 text-amber-600 drop-shadow-[0_3px_8px_rgba(146,64,14,0.35)]"
                strokeWidth={2.3}
              />
              <span className="pointer-events-none absolute -right-1 -top-1 text-lg text-amber-500">
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
      ) : null}

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
      `}</style>

      <style jsx global>{`
        canvas.canvas-confetti {
          pointer-events: none !important;
        }
      `}</style>
    </>
  );
}
