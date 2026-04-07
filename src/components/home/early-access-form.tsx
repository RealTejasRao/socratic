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

export default function EarlyAccessForm() {
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

      const data = (await response.json()) as { message?: string };

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
        message: "Network error. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusClassName =
    status.tone === "error"
      ? "text-red-300"
      : status.tone === "success"
        ? "text-emerald-300"
        : "text-slate-300/85";

  return (
    <>
      <form noValidate onSubmit={onSubmit} className="relative mt-5 space-y-3">
        <input
          type="text"
          name="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          aria-invalid={status.tone === "error"}
          className="h-12 w-full rounded-2xl border border-white/24 bg-black/40 px-4 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_24px_rgba(0,0,0,0.35)] outline-none placeholder:text-slate-300/65 transition focus:border-orange-300/55 focus:bg-black/52 focus:ring-2 focus:ring-orange-300/35"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full cursor-pointer rounded-2xl bg-linear-to-r from-orange-500 via-amber-500 to-rose-500 text-sm font-semibold tracking-[0.01em] text-black shadow-[0_14px_30px_rgba(251,146,60,0.36),inset_0_1px_0_rgba(255,255,255,0.42)] transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Hold on..." : "Reserve my spot"}
        </button>
        <p className={`text-center text-xs ${statusClassName}`}>
          {status.message || "No spam. Just one email when access opens."}
        </p>
      </form>

      {showGiftPopup ? (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-[#0f172a]/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/22 bg-slate-950/88 p-5 text-center shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
            <p className="text-[11px] font-medium tracking-[0.08em] text-emerald-300 uppercase">
              Added successfully
            </p>
            <h3
              className={`${instrumentSerif.className} mt-1.5 text-3xl leading-tight text-white`}
            >
              Here is a gift for you
            </h3>
            <a
              href="https://youtu.be/QDia3e12czc?si=VmG8elzvdKkMvZT4"
              target="_blank"
              rel="noreferrer"
              className="gift-cta group relative mx-auto mt-5 mb-3 flex h-32 w-32 cursor-pointer items-center justify-center rounded-full bg-linear-to-br from-amber-200 via-orange-100 to-rose-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_34px_rgba(217,119,6,0.34)] transition hover:scale-105"
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
              className="relative z-10 mt-2 flex h-10 w-full cursor-pointer items-center justify-center rounded-lg text-xs text-slate-300 underline-offset-2 transition hover:bg-white/10 hover:text-white hover:underline"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .gift-cta {
          animation: giftShake 1.05s ease-in-out infinite;
          transform-origin: center;
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
