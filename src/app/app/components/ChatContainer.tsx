"use client";

import Image from "next/image";
import type { Route } from "next";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";
import confetti from "canvas-confetti";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowUpRight,
  ArrowLeft,
  Check,
  ChevronDown,
  Crown,
  GraduationCap,
  ScrollText,
  Swords,
  X,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { getDebateDurationMeta } from "src/lib/debate";
import { isSocraticTone, type SocraticTone } from "src/lib/socratic";
import {
  ROLEPLAY_FLAIR_THEMES,
  getRoleplayPhilosopherConfig,
  type RoleplayFlair,
  type RoleplayPhilosopherId,
} from "src/lib/roleplay";
import type {
  ChatImageAttachment,
  ChatMessage,
  ChatSessionMeta,
  SessionMode,
} from "src/types/chat";
import type { BillingStateResponse } from "src/types/billing";
import { TypewriterHeading } from "@/src/components/ui/typewriter-heading";
import { SUGGESTION_QUESTIONS } from "@/src/lib/suggestion-questions";
import { resolveOptimizedCloudinaryPublicAsset } from "@/src/lib/cloudinary-public-assets";
import { ROUTES } from "@/src/lib/routes";
import { PLAN_LIMITS } from "@/src/lib/billing";
import { PremiumCrownIcon } from "@/src/components/billingsdk/premium-crown-icon";
import { RoseCurveLoader } from "@/src/components/ui/rose-curve-loader";
import DebateModeSetup from "./DebateModeSetup";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import RoleplayModeSetup from "./RoleplayModeSetup";

interface Props {
  initialMessages: ChatMessage[];
  sessionId?: string;
  sessionMeta?: ChatSessionMeta;
  initialAutoSendMessage?: string | null;
  initialBilling?: Pick<BillingStateResponse, "isPremium" | "usage" | "features">;
  userStorageId?: string | null;
  initialUserName?: string | null;
}

function getModeFromSearchParam(value: string | null): SessionMode {
  const normalized = value?.toLowerCase().trim();

  if (normalized === "socratic") {
    return "SOCRATIC";
  }

  if (normalized === "debate") {
    return "DEBATE";
  }

  if (normalized === "roleplay") {
    return "ROLEPLAY";
  }

  return "ROLEPLAY";
}

function getModeHref(mode: SessionMode) {
  if (mode === "DEBATE") {
    return `${ROUTES.APP}?mode=debate` as Route;
  }

  if (mode === "ROLEPLAY") {
    return `${ROUTES.APP}?mode=roleplay` as Route;
  }

  return `${ROUTES.APP}?mode=socratic` as Route;
}

const MORNING_GREETINGS = [
  "A new day, a new tabula rasa.",
  "Clarity is just a few prompts away.",
  "Everything's ready, let's begin.",
  "Good morning, {name}.",
  "Here in the morning. Good, {name}.",
  "Clear mind. Let's use it.",
  "The day hasn't ruined you yet, {name}",
];

const AFTERNOON_GREETINGS = [
  "The day is half gone, let's make the second half count.",
  "Peak efficiency mode engaged.",
  "Time is moving, are you?",
  "Good afternoon, {name}.",
  "Midday. Still here, {name}",
  "Back at it, {name}",
];

const EVENING_GREETINGS = [
  "The distractions are winding down. The thinking can begin.",
  "Aristotle did his best work at dusk. Now it's your turn.",
  "The sun sets, {name}. The mind rises.",
  "Good evening, {name}.",
  "Sunset is philosophy's hour.",
  "Evening light. Different questions now.",
];

const LATE_GREETINGS = [
  "The best philosophers were night owls too.",
  "Seek the light in the dark.",
  "The world's quiet, best time to talk.",
  "Late. Honest.",
  "Night thoughts cut deeper, {name}",
  "Can't sleep, {name}? Or won't?",
  "Darkness is the oldest classroom, {name}.",
];

const FALLBACK_STARTER_CHIPS = [
  "Why do we fear death if we won't be there to experience it?",
  "Was Socrates right to accept his own death?",
];

const STARTER_CHIP_COUNT = 2;
const poppinsClassName = "[font-family:Poppins,sans-serif]";
const SOCRATIC_TONE_KEY = "socratic:settings:socraticTone";
const APP_QUICK_TOUR_STORAGE_KEY = "socratic:app-quick-tour:v1";

const APP_QUICK_TOUR_STEPS: {
  id: string;
  mode: SessionMode;
  targets: string[];
  accent: string;
  title: string;
  detail: string;
}[] = [
  {
    id: "socratic",
    mode: "SOCRATIC",
    targets: ["mode-option-socratic"],
    accent: "#57f2cf",
    title: "Socratic",
    detail:
      "Your all in one space for deep, open-ended conversation. Bring any topic, idea, or question and we'll make sure you think harder than you were planning to.",
  },
  {
    id: "debate",
    mode: "DEBATE",
    targets: ["mode-option-debate"],
    accent: "#ff9f43",
    title: "Debate",
    detail:
      "Pick a topic, pick a side, and go head to head with an AI that argues back for real. Learn and improve instantly using the Post Match Report.",
  },
  {
    id: "roleplay",
    mode: "ROLEPLAY",
    targets: ["mode-option-roleplay"],
    accent: "#8bd3ff",
    title: "Roleplay",
    detail:
      "Have an actual conversation with a philosopher, in their own voice and logic. Discuss ideas, life and more...",
  },
  {
    id: "switching",
    mode: "ROLEPLAY",
    targets: [
      "mode-switch-menu",
      "sidebar-mode-links",
    ],
    accent: "#57f2cf",
    title: "Switch modes",
    detail:
      "Switch modes from the top dropdown or the sidebar shortcuts for Debate mode and Talk to a Philosopher (Roleplay Mode).",
  },
];

function getRoleplayFlairStyle(flair: string) {
  const theme =
    ROLEPLAY_FLAIR_THEMES[flair as RoleplayFlair] ?? ROLEPLAY_FLAIR_THEMES.All;

  return {
    "--roleplay-flair-bg": theme.background,
    "--roleplay-flair-border": theme.border,
  } as CSSProperties;
}

type ErrorToastState = {
  message: string;
  isLeaving: boolean;
} | null;

const DEFAULT_UPGRADE_PROMPT_TEXT =
  "Fellow human, this feature requires a premium plan.";
const DAILY_MESSAGES_UPGRADE_PROMPT_TEXT =
  `Fellow human, you've reached the free limit of ${PLAN_LIMITS.FREE_DAILY_MESSAGES} messages for today.`;
const DAILY_UPLOADS_UPGRADE_PROMPT_TEXT =
  `Fellow human, you've reached the free limit of ${PLAN_LIMITS.FREE_DAILY_IMAGE_UPLOADS} image uploads for today.`;
const DAILY_MESSAGES_LIMIT_REASON =
  "Daily free limit reached. Upgrade to Socratic+ for unlimited messages.";
const DAILY_IMAGE_UPLOAD_LIMIT_REASON =
  "Daily free image upload limit reached. Upgrade to Socratic+ for unlimited image uploads.";

let greetingSeedStore = 0;
const greetingSeedListeners = new Set<() => void>();
let starterChipStore: string[] | null = null;
const starterChipListeners = new Set<() => void>();

function getGreetingBucket(hour: number) {
  if (hour >= 5 && hour < 12) return MORNING_GREETINGS;
  if (hour >= 12 && hour < 17) return AFTERNOON_GREETINGS;
  if (hour >= 17 && hour < 21) return EVENING_GREETINGS;
  return LATE_GREETINGS;
}

function subscribeToGreetingSeed(listener: () => void) {
  greetingSeedListeners.add(listener);

  if (typeof window !== "undefined" && greetingSeedStore === 0) {
    const seedArray = new Uint32Array(1);
    window.crypto.getRandomValues(seedArray);
    greetingSeedStore = seedArray[0] || 1;

    queueMicrotask(() => {
      greetingSeedListeners.forEach((currentListener) => currentListener());
    });
  }

  return () => {
    greetingSeedListeners.delete(listener);
  };
}

function getGreetingSeedSnapshot() {
  return greetingSeedStore;
}

function subscribeToStarterChips(listener: () => void) {
  starterChipListeners.add(listener);

  if (typeof window !== "undefined" && starterChipStore === null) {
    queueMicrotask(() => {
      if (starterChipStore !== null) {
        return;
      }

      const randomQuestions = pickRandomQuestions(
        [...SUGGESTION_QUESTIONS],
        STARTER_CHIP_COUNT,
      );

      starterChipStore =
        randomQuestions.length > 0
          ? randomQuestions
          : pickRandomQuestions(FALLBACK_STARTER_CHIPS, STARTER_CHIP_COUNT);

      starterChipListeners.forEach((currentListener) => currentListener());
    });
  }

  return () => {
    starterChipListeners.delete(listener);
  };
}

function getStarterChipSnapshot() {
  return starterChipStore ?? FALLBACK_STARTER_CHIPS;
}

function pickRandomQuestions(questions: string[], count: number) {
  const uniqueQuestions = Array.from(new Set(questions));

  for (let index = uniqueQuestions.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const current = uniqueQuestions[index];
    const randomValue = uniqueQuestions[randomIndex];

    if (current === undefined || randomValue === undefined) {
      continue;
    }

    uniqueQuestions[index] = randomValue;
    uniqueQuestions[randomIndex] = current;
  }

  return uniqueQuestions.slice(0, count);
}

function getSocraticToneSetting(): SocraticTone {
  if (typeof window === "undefined") {
    return "SIMPLE_CLEAR";
  }

  try {
    const stored = localStorage.getItem(SOCRATIC_TONE_KEY);
    return isSocraticTone(stored) ? stored : "SIMPLE_CLEAR";
  } catch {
    return "SIMPLE_CLEAR";
  }
}

function clampNumber(value: number, min: number, max: number) {
  if (max < min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function getQuickTourStorageKey(userId: string) {
  return `${APP_QUICK_TOUR_STORAGE_KEY}:${userId}`;
}

function AppQuickTour({
  activeStep,
  onStepChange,
  onClose,
}: {
  activeStep: number;
  onStepChange: (nextStep: number) => void;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [targetFrames, setTargetFrames] = useState<
    {
      top: number;
      left: number;
      width: number;
      height: number;
    }[]
  >([]);
  const [anchorFrame, setAnchorFrame] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
    viewportWidth: number;
    viewportHeight: number;
  } | null>(null);
  const [cardFrame, setCardFrame] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const step =
    APP_QUICK_TOUR_STEPS[activeStep] ?? APP_QUICK_TOUR_STEPS[0]!;
  const isLastStep = activeStep === APP_QUICK_TOUR_STEPS.length - 1;

  useEffect(() => {
    document.documentElement.dataset["appTourStep"] = step.id;

    return () => {
      delete document.documentElement.dataset["appTourStep"];
    };
  }, [step.id]);

  useEffect(() => {
    function measureAnchor() {
      const frames = step.targets
        .flatMap((target) =>
          Array.from(
            document.querySelectorAll<HTMLElement>(
              `[data-app-tour-target='${target}']`,
            ),
          ),
        )
        .map((element) => element.getBoundingClientRect())
        .filter(
          (rect) =>
            rect.width > 0 &&
            rect.height > 0 &&
            rect.bottom > 0 &&
            rect.right > 0 &&
            rect.top < window.innerHeight &&
            rect.left < window.innerWidth,
        )
        .map((rect) => ({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }));

      const fallbackRect =
        document
          .querySelector<HTMLElement>("[data-app-tour-target='mode-switch']")
          ?.getBoundingClientRect() ?? null;
      const nextFrames =
        frames.length > 0
          ? frames
          : [
              {
                top: fallbackRect?.top ?? 14,
                left: fallbackRect?.left ?? window.innerWidth / 2 - 72,
                width: fallbackRect?.width ?? 144,
                height: fallbackRect?.height ?? 40,
              },
            ];
      const top = Math.min(...nextFrames.map((frame) => frame.top));
      const left = Math.min(...nextFrames.map((frame) => frame.left));
      const right = Math.max(
        ...nextFrames.map((frame) => frame.left + frame.width),
      );
      const bottom = Math.max(
        ...nextFrames.map((frame) => frame.top + frame.height),
      );

      setTargetFrames(nextFrames);
      setAnchorFrame({
        top,
        left,
        width: right - left,
        height: bottom - top,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      });
    }

    measureAnchor();

    const frameIds: number[] = [];
    frameIds.push(window.requestAnimationFrame(measureAnchor));
    frameIds.push(
      window.requestAnimationFrame(() => {
        frameIds.push(window.requestAnimationFrame(measureAnchor));
      }),
    );
    const timeoutIds = [120, 220, 320].map((delay) =>
      window.setTimeout(measureAnchor, delay),
    );
    window.addEventListener("resize", measureAnchor);
    window.addEventListener("scroll", measureAnchor, true);

    return () => {
      frameIds.forEach((frameId) => window.cancelAnimationFrame(frameId));
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      window.removeEventListener("resize", measureAnchor);
      window.removeEventListener("scroll", measureAnchor, true);
    };
  }, [activeStep, step.targets]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowRight" && !isLastStep) {
        onStepChange(activeStep + 1);
      }

      if (event.key === "ArrowLeft" && activeStep > 0) {
        onStepChange(activeStep - 1);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeStep, isLastStep, onClose, onStepChange]);

  useEffect(() => {
    const cardElement = cardRef.current;

    if (cardElement === null) {
      return;
    }

    const currentCardElement = cardElement;

    function measureCard() {
      const rect = currentCardElement.getBoundingClientRect();

      setCardFrame({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    }

    measureCard();

    const resizeObserver = new ResizeObserver(measureCard);
    resizeObserver.observe(currentCardElement);
    window.addEventListener("resize", measureCard);
    window.addEventListener("scroll", measureCard, true);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measureCard);
      window.removeEventListener("scroll", measureCard, true);
    };
  }, [activeStep, anchorFrame]);

  const spotlightStyles = targetFrames.map((frame) => ({
    "--tour-accent": step.accent,
    top: frame.top - 7,
    left: frame.left - 7,
    width: frame.width + 14,
    height: frame.height + 14,
  }));
  const isCompactTour =
    anchorFrame ? anchorFrame.viewportWidth < 768 : false;
  const isSwitchingStep = step.id === "switching";
  const cardWidth =
    anchorFrame?.viewportWidth && anchorFrame.viewportWidth < 520
      ? Math.min(anchorFrame.viewportWidth - 28, 320)
      : isSwitchingStep
        ? 360
        : 320;
  const estimatedCardHeight = isCompactTour ? 330 : 305;
  const cardTop = anchorFrame
    ? anchorFrame.viewportWidth < 768
      ? clampNumber(
          anchorFrame.top + anchorFrame.height + 18,
          58,
          anchorFrame.viewportHeight - estimatedCardHeight - 14,
        )
      : clampNumber(
          anchorFrame.top + anchorFrame.height + 22,
          72,
          anchorFrame.viewportHeight - estimatedCardHeight - 16,
        )
    : 0;
  const cardLeft = anchorFrame
    ? anchorFrame.viewportWidth < 520
      ? 14
      : clampNumber(
          anchorFrame.left + anchorFrame.width / 2 - cardWidth / 2,
          18,
          anchorFrame.viewportWidth - cardWidth - 18,
        )
    : 0;
  const measuredCardTop = cardFrame?.top ?? cardTop;
  const measuredCardLeft = cardFrame?.left ?? cardLeft;
  const measuredCardWidth = cardFrame?.width ?? cardWidth;
  const measuredCardHeight = cardFrame?.height ?? 330;
  const previewWidth = anchorFrame
    ? anchorFrame.viewportWidth < 768
      ? Math.min(anchorFrame.viewportWidth - 28, 300)
      : Math.min(
          300,
          Math.max(
            250,
            anchorFrame.viewportWidth -
              measuredCardLeft -
              measuredCardWidth -
              44,
          ),
        )
    : 320;
  const previewHeight = isCompactTour ? 198 : 218;
  const previewFitsRight = anchorFrame
    ? measuredCardLeft + measuredCardWidth + previewWidth + 34 <=
      anchorFrame.viewportWidth
    : false;
  const previewLeft = anchorFrame
    ? isCompactTour
      ? clampNumber(
          measuredCardLeft,
          14,
          anchorFrame.viewportWidth - previewWidth - 14,
        )
      : previewFitsRight
        ? measuredCardLeft + measuredCardWidth + 18
        : clampNumber(
            measuredCardLeft - previewWidth - 18,
            18,
            anchorFrame.viewportWidth - previewWidth - 18,
          )
    : 0;
  const compactPreviewFitsBelow = anchorFrame
    ? measuredCardTop + measuredCardHeight + previewHeight + 12 <=
      anchorFrame.viewportHeight
    : true;
  const compactPreviewTop = anchorFrame
    ? compactPreviewFitsBelow
      ? measuredCardTop + measuredCardHeight + 12
      : clampNumber(
          measuredCardTop - previewHeight - 12,
          74,
          anchorFrame.viewportHeight - previewHeight - 14,
        )
    : 0;
  const previewStyle = anchorFrame
    ? {
        "--tour-accent": step.accent,
        width: previewWidth,
        top: isCompactTour
          ? compactPreviewTop
          : clampNumber(
              measuredCardTop + 22,
              82,
              anchorFrame.viewportHeight - previewHeight,
            ),
        left: previewLeft,
      }
    : {};
  const cardStyle = anchorFrame
    ? {
        "--tour-accent": step.accent,
        width: cardWidth,
        maxHeight: Math.max(
          260,
          anchorFrame.viewportHeight - cardTop - (isCompactTour ? 12 : 16),
        ),
        top: cardTop,
        left: cardLeft,
      }
    : {};

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      aria-live="polite"
    >
      {spotlightStyles.map((spotlightStyle, index) => (
        <motion.div
          key={`${step.id}-${index}`}
          className="app-tour-spotlight pointer-events-none fixed rounded-[18px]"
          data-tour-dim={index === 0}
          style={spotlightStyle}
          layout
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}

      <motion.div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${step.title} introduction`}
        className="app-tour-card pointer-events-auto fixed overflow-y-auto overscroll-contain rounded-[24px] border p-0 text-white"
        style={cardStyle}
        key={step.id}
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[29px] leading-[0.95] tracking-[-0.035em] font-[Georgia,serif] md:text-[32px]">
                {step.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center text-white/62 transition hover:text-white"
              aria-label="Skip app tour"
            >
              <X size={19} strokeWidth={1.7} />
            </button>
          </div>

          <div className="mt-2">
            <p className="text-[13px] leading-5 text-white/76 md:text-[14px] md:leading-6">
              {step.detail}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-1 rounded-[16px] border border-white/10 bg-black/20 p-1">
            {APP_QUICK_TOUR_STEPS.map((tourStep, index) => (
              <button
                key={tourStep.id}
                type="button"
                onClick={() => onStepChange(index)}
                className={cn(
                  "relative flex min-h-9 cursor-pointer items-center justify-center gap-1.5 overflow-hidden rounded-[12px] px-2.5 py-1.5 text-[12px] font-semibold transition",
                  index === activeStep
                    ? "text-[#06120f]"
                    : "text-white/52 hover:bg-white/[0.06] hover:text-white",
                )}
              >
                {index === activeStep ? (
                  <motion.span
                    layoutId="app-tour-step-active"
                    className="absolute inset-0 rounded-[12px] bg-[color:var(--tour-accent)]"
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  />
                ) : null}
                <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full text-[12px]">
                  {index + 1}
                </span>
                <span className="relative leading-3.5">{tourStep.title}</span>
              </button>
            ))}
          </div>

          <div className="mt-3.5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onStepChange(activeStep - 1)}
              disabled={activeStep === 0}
              className="cursor-pointer rounded-full px-2.5 py-1.5 text-[11px] font-medium text-white/56 transition hover:bg-white/[0.07] hover:text-white disabled:pointer-events-none disabled:opacity-35"
            >
              Back
            </button>

            <button
              type="button"
              onClick={() => {
                if (isLastStep) {
                  onClose();
                  return;
                }

                onStepChange(activeStep + 1);
              }}
              className="app-tour-primary-btn inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold text-[#06120f] transition"
            >
              {isLastStep ? "Finish" : "Next"}
              {!isLastStep ? <ArrowUpRight size={13} /> : null}
            </button>
          </div>
        </div>
      </motion.div>

      {step.id === "debate" && anchorFrame ? (
        <motion.div
          className="app-tour-report-preview pointer-events-auto fixed overflow-hidden rounded-[20px] border"
          data-side={
            isCompactTour
              ? compactPreviewFitsBelow
                ? "bottom"
                : "top"
              : previewFitsRight
                ? "right"
                : "left"
          }
          style={previewStyle}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3.5 py-2.5">
            <div>
              <p className="text-[13px] font-semibold text-white">
                Post Match Report Preview
              </p>
            </div>
            <span className="rounded-full bg-[color:var(--tour-accent)] px-2 py-0.5 text-[10px] font-bold text-[#120c04]">
              Debate
            </span>
          </div>

          <div className="relative h-[145px] bg-[#f7f4ec] md:h-[165px]">
            <Image
              src="/app/debate-report-preview.png"
              alt="Preview of the Debate Mode post-match report"
              fill
              sizes="(max-width: 767px) 360px, 340px"
              className="object-cover object-top"
              priority
            />
          </div>
        </motion.div>
      ) : null}
    </motion.div>
  );
}

export default function ChatContainer({
  initialMessages,
  sessionId,
  sessionMeta = { mode: "ROLEPLAY" },
  initialAutoSendMessage = null,
  userStorageId = null,
  initialUserName = null,
  initialBilling = {
    isPremium: false,
    usage: {
      dailyMessageLimit: PLAN_LIMITS.FREE_DAILY_MESSAGES,
      dailyMessagesUsed: 0,
      dailyMessagesRemaining: PLAN_LIMITS.FREE_DAILY_MESSAGES,
      dailyImageUploadLimit: PLAN_LIMITS.FREE_DAILY_IMAGE_UPLOADS,
      dailyImageUploadsUsed: 0,
      dailyImageUploadsRemaining: PLAN_LIMITS.FREE_DAILY_IMAGE_UPLOADS,
      resetsAt: null,
    },
    features: {
      debateMode: false,
      detailedDebateFeedback: false,
      ruthlessTone: false,
      globalMemory: false,
      earlyAccess: false,
    },
  },
}: Props) {
  const greetingSeed = useSyncExternalStore(
    subscribeToGreetingSeed,
    getGreetingSeedSnapshot,
    () => 0,
  );
  const starterChips = useSyncExternalStore(
    subscribeToStarterChips,
    getStarterChipSnapshot,
    () => FALLBACK_STARTER_CHIPS,
  );
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(
    null,
  );
  const [editDraft, setEditDraft] = useState("");
  const [modeSelection, setModeSelection] = useState(sessionMeta.mode);
  const [activeSessionMeta, setActiveSessionMeta] =
    useState<ChatSessionMeta>(sessionMeta);
  const [pendingRoleplayId, setPendingRoleplayId] =
    useState<RoleplayPhilosopherId | null>(null);
  const [showWinnerReveal, setShowWinnerReveal] = useState(false);
  const [debateNowMs, setDebateNowMs] = useState<number | null>(null);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [errorToast, setErrorToast] = useState<ErrorToastState>(null);
  const [billing, setBilling] = useState(initialBilling);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [isPricingNavigationPending, setIsPricingNavigationPending] =
    useState(false);
  const [upgradePromptSmallText, setUpgradePromptSmallText] = useState(
    DEFAULT_UPGRADE_PROMPT_TEXT,
  );
  const [showQuickTour, setShowQuickTour] = useState(false);
  const [quickTourStep, setQuickTourStep] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState(sessionId);
  const tempIdRef = useRef(0);
  const autoSendTriggeredRef = useRef(false);
  const activeStreamControllerRef = useRef<AbortController | null>(null);
  const finalizeRequestedRef = useRef(false);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasMessages = messages.length > 0;
  const isDebateSession = activeSessionMeta.mode === "DEBATE";
  const isRoleplaySession = activeSessionMeta.mode === "ROLEPLAY";
  const isDebateCompleted = activeSessionMeta.debate?.status === "COMPLETED";
  const completedDebate = isDebateCompleted ? activeSessionMeta.debate : null;
  const rawName = initialUserName?.trim() || "friend";
  const name = rawName.length > 0 ? rawName : "friend";
  const userLabel = name === "friend" ? "You" : name;
  const winnerLabel =
    completedDebate?.winner === "USER"
      ? userLabel
      : completedDebate?.winner === "ASSISTANT"
        ? "Socratic AI"
        : completedDebate?.winner === "DRAW"
          ? "Draw"
          : "Pending";
  const debateDurationMeta = activeSessionMeta.debate
    ? getDebateDurationMeta(activeSessionMeta.debate.durationPreset)
    : null;
  const pendingRoleplayPhilosopher = pendingRoleplayId
    ? getRoleplayPhilosopherConfig(pendingRoleplayId)
    : null;
  const activeRoleplayPhilosopher = activeSessionMeta.roleplay ?? null;
  const visibleRoleplayPhilosopher = activeRoleplayPhilosopher
    ? {
        philosopherId: activeRoleplayPhilosopher.philosopherId,
        philosopherName: activeRoleplayPhilosopher.philosopherName,
        imagePath: activeRoleplayPhilosopher.imagePath,
        flairs: activeRoleplayPhilosopher.flairs,
        expertise: activeRoleplayPhilosopher.expertise,
        shortDescription: activeRoleplayPhilosopher.shortDescription,
        bestFor: activeRoleplayPhilosopher.bestFor,
        starterPrompts: activeRoleplayPhilosopher.starterPrompts,
        voicePreview: activeRoleplayPhilosopher.voicePreview,
        accent: activeRoleplayPhilosopher.accent,
      }
    : pendingRoleplayPhilosopher
      ? {
          philosopherId: pendingRoleplayPhilosopher.id,
          philosopherName: pendingRoleplayPhilosopher.name,
          imagePath: pendingRoleplayPhilosopher.imagePath,
          flairs: [...pendingRoleplayPhilosopher.flairs],
          expertise: pendingRoleplayPhilosopher.expertise,
          shortDescription: pendingRoleplayPhilosopher.shortDescription,
          bestFor: pendingRoleplayPhilosopher.bestFor,
          starterPrompts: [...pendingRoleplayPhilosopher.starterPrompts],
          voicePreview: pendingRoleplayPhilosopher.voicePreview,
          accent: pendingRoleplayPhilosopher.accent,
        }
      : null;
  const remainingDebateSeconds =
    activeSessionMeta.debate?.hasTimer &&
    activeSessionMeta.debate.startedAt &&
    debateDurationMeta?.minutes &&
    debateNowMs !== null
      ? Math.max(
          0,
          Math.ceil(
            (new Date(activeSessionMeta.debate.startedAt).getTime() +
              debateDurationMeta.minutes * 60 * 1000 -
              debateNowMs) /
              1000,
          ),
        )
      : null;
  const inputPlaceholder = isDebateSession
    ? "Defend your side."
    : visibleRoleplayPhilosopher
      ? `Message ${visibleRoleplayPhilosopher.philosopherName}.`
      : name === "friend"
        ? "What's on your mind?"
        : `What's on your mind, ${name}?`;
  const greetingLine = (() => {
    if (greetingSeed === 0) {
      return "";
    }

    const bucket = getGreetingBucket(new Date().getHours());
    const template =
      bucket[greetingSeed % bucket.length] ??
      "Clarity is just a few prompts away.";

    return template.replace("{name}", name);
  })();

  async function refreshBillingState() {
    try {
      const response = await fetch("/api/v1/billing/state", {
        method: "GET",
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as BillingStateResponse;
      setBilling({
        isPremium: payload.isPremium,
        usage: payload.usage,
        features: payload.features,
      });
    } catch {
      // best effort
    }
  }

  function selectNewChatMode(mode: SessionMode, updateUrl = true) {
    setModeSelection(mode);
    setActiveSessionMeta({ mode });
    setPendingRoleplayId(null);

    if (updateUrl) {
      router.replace(getModeHref(mode), { scroll: false });
    }
  }

  function markQuickTourComplete() {
    if (!userStorageId) {
      setShowQuickTour(false);
      setIsModeMenuOpen(false);
      selectNewChatMode("ROLEPLAY");
      return;
    }

    try {
      localStorage.setItem(getQuickTourStorageKey(userStorageId), "complete");
    } catch {
      // best effort
    }

    setShowQuickTour(false);
    setIsModeMenuOpen(false);
    selectNewChatMode("ROLEPLAY");
  }

  function moveQuickTourToStep(nextStep: number) {
    const boundedStep = clampNumber(
      nextStep,
      0,
      APP_QUICK_TOUR_STEPS.length - 1,
    );
    const nextTourStep =
      APP_QUICK_TOUR_STEPS[boundedStep] ?? APP_QUICK_TOUR_STEPS[0]!;

    setQuickTourStep(boundedStep);
    setIsModeMenuOpen(true);
    selectNewChatMode(nextTourStep.mode, false);
  }

  useEffect(() => {
    setActiveSessionMeta(sessionMeta);
  }, [sessionMeta]);

  useEffect(() => {
    if (activeSessionId || messages.length > 0) {
      return;
    }

    selectNewChatMode(getModeFromSearchParam(searchParams.get("mode")), false);
  // selectNewChatMode intentionally stays outside deps to avoid URL sync loops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId, messages.length, searchParams]);

  useEffect(() => {
    void refreshBillingState();
  }, []);

  useEffect(() => {
    if (
      pathname !== ROUTES.APP ||
      activeSessionId ||
      messages.length > 0 ||
      initialAutoSendMessage ||
      !userStorageId
    ) {
      return;
    }

    try {
      if (
        localStorage.getItem(getQuickTourStorageKey(userStorageId)) ===
        "complete"
      ) {
        return;
      }
    } catch {
      return;
    }

    setQuickTourStep(0);
    setShowQuickTour(true);
    setIsModeMenuOpen(true);
    selectNewChatMode("SOCRATIC", false);
  // selectNewChatMode intentionally stays outside deps; this only initializes first-run onboarding.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeSessionId,
    initialAutoSendMessage,
    messages.length,
    pathname,
    userStorageId,
  ]);

  useEffect(() => {
    setActiveSessionId(sessionId);
  }, [sessionId]);

  useEffect(() => {
    if (!isPricingNavigationPending) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsPricingNavigationPending(false);
    }, 12000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isPricingNavigationPending]);

  useEffect(() => {
    autoSendTriggeredRef.current = false;
  }, [sessionId, initialAutoSendMessage]);

  useEffect(() => {
    if (sessionMeta.mode === "ROLEPLAY" && sessionMeta.roleplay) {
      setPendingRoleplayId(null);
      setModeSelection("ROLEPLAY");
    }
  }, [sessionMeta.mode, sessionMeta.roleplay]);

  useEffect(() => {
    setShowWinnerReveal(false);
    finalizeRequestedRef.current = false;
  }, [activeSessionId, isDebateCompleted]);

  useEffect(() => {
    function handleNewChatRequested() {
      setMessages([]);
      setEditingMessage(null);
      setEditDraft("");
      selectNewChatMode("ROLEPLAY");
      setPendingRoleplayId(null);
      setShowWinnerReveal(false);
      finalizeRequestedRef.current = false;
      setActiveSessionId(undefined);
    }

    window.addEventListener(
      "socratic:new-chat:requested",
      handleNewChatRequested,
    );

    return () => {
      window.removeEventListener(
        "socratic:new-chat:requested",
        handleNewChatRequested,
      );
    };
  // selectNewChatMode intentionally stays outside deps; this listener is mounted once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const debate = activeSessionMeta.debate;

    if (
      !debate ||
      !debate.hasTimer ||
      !debate.startedAt ||
      debate.status === "COMPLETED" ||
      !debateDurationMeta?.minutes
    ) {
      return;
    }

    const syncTimeoutId = window.setTimeout(() => {
      setDebateNowMs(Date.now());
    }, 0);

    const intervalId = window.setInterval(() => {
      setDebateNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearTimeout(syncTimeoutId);
      window.clearInterval(intervalId);
    };
  }, [
    activeSessionMeta.debate,
    activeSessionMeta.debate?.hasTimer,
    activeSessionMeta.debate?.startedAt,
    activeSessionMeta.debate?.status,
    debateDurationMeta?.minutes,
  ]);

  useEffect(() => {
    if (!isModeMenuOpen || showQuickTour) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (!modeMenuRef.current?.contains(event.target)) {
        setIsModeMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModeMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModeMenuOpen, showQuickTour]);

  useEffect(() => {
    const handleUpgradePromptOpen = (event: Event) => {
      const detail = (event as CustomEvent<
        { reason?: string; smallText?: string } | undefined
      >).detail;
      openUpgradePrompt(detail);
    };

    window.addEventListener(
      "socratic:upgrade-prompt:open",
      handleUpgradePromptOpen,
    );

    return () => {
      window.removeEventListener(
        "socratic:upgrade-prompt:open",
        handleUpgradePromptOpen,
      );
    };
  }, []);

  useEffect(() => {
    const debate = activeSessionMeta.debate;

    if (
      !activeSessionId ||
      !debate ||
      debate.status === "COMPLETED" ||
      !debate.hasTimer ||
      remainingDebateSeconds === null ||
      remainingDebateSeconds > 0 ||
      finalizeRequestedRef.current
    ) {
      return;
    }

    finalizeRequestedRef.current = true;

    fetch("/api/v1/chat/debates/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: activeSessionId }),
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

        setActiveSessionMeta((current) => ({
          ...current,
          status: "CLOSED",
          debate: current.debate
            ? {
                ...current.debate,
                status: payload.debateStatus,
                endedAt: payload.debateEndedAt,
                winner: payload.debateWinner,
                verdictSummary: payload.debateVerdictSummary,
                summary: payload.debateSummary,
              }
            : null,
        }));
      })
      .finally(() => {
        router.refresh();
      });
  }, [
    activeSessionMeta.debate,
    activeSessionId,
    remainingDebateSeconds,
    router,
  ]);

  useEffect(() => {
    if (!showWinnerReveal) {
      return;
    }

    const colors = [
      "#f59e0b",
      "#ef4444",
      "#3b82f6",
      "#22c55e",
      "#a855f7",
      "#ec4899",
      "#14b8a6",
      "#f97316",
      "#eab308",
    ];
    const endAt = Date.now() + 2200;

    confetti({
      particleCount: 220,
      spread: 120,
      startVelocity: 46,
      ticks: 280,
      scalar: 1.05,
      origin: { y: 0.58 },
      colors,
      zIndex: 70,
    });

    let confettiTimeoutId = 0;
    const launchSideBursts = () => {
      const timeLeft = endAt - Date.now();
      if (timeLeft <= 0) {
        return;
      }

      confetti({
        particleCount: 14,
        angle: 60,
        spread: 78,
        startVelocity: 36,
        ticks: 240,
        origin: { x: 0, y: 0.62 },
        colors,
        zIndex: 70,
      });

      confetti({
        particleCount: 14,
        angle: 120,
        spread: 78,
        startVelocity: 36,
        ticks: 240,
        origin: { x: 1, y: 0.62 },
        colors,
        zIndex: 70,
      });

      confettiTimeoutId = window.setTimeout(launchSideBursts, 180);
    };

    const kickoffTimeoutId = window.setTimeout(launchSideBursts, 120);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowWinnerReveal(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(kickoffTimeoutId);
      window.clearTimeout(confettiTimeoutId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showWinnerReveal]);

  useEffect(() => {
    if (!errorToast) {
      return;
    }

    if (errorToast.isLeaving) {
      const timeoutId = window.setTimeout(() => {
        setErrorToast(null);
      }, 240);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    const timeoutId = window.setTimeout(() => {
      setErrorToast((current) =>
        current
          ? {
              ...current,
              isLeaving: true,
            }
          : null,
      );
    }, 2600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [errorToast]);

  function showErrorToast(message: string) {
    setErrorToast({
      message,
      isLeaving: false,
    });
  }

  function resolveUpgradePromptSmallText(reason?: string) {
    if (!reason) {
      return DEFAULT_UPGRADE_PROMPT_TEXT;
    }

    const normalized = reason.toLowerCase();

    if (
      normalized.includes("image upload limit") ||
      normalized.includes("unlimited image uploads")
    ) {
      return DAILY_UPLOADS_UPGRADE_PROMPT_TEXT;
    }

    if (
      normalized.includes("daily free limit reached") ||
      normalized.includes("unlimited messages")
    ) {
      return DAILY_MESSAGES_UPGRADE_PROMPT_TEXT;
    }

    return DEFAULT_UPGRADE_PROMPT_TEXT;
  }

  async function readUpgradeReason(response: Response) {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const payload = (await response.json().catch(() => null)) as
        | { reason?: string }
        | null;
      if (typeof payload?.reason === "string" && payload.reason.trim()) {
        return payload.reason.trim();
      }
      return undefined;
    }

    const text = await response.text().catch(() => "");
    const trimmed = text.trim();
    return trimmed ? trimmed : undefined;
  }

  function openUpgradePrompt(detail?: { reason?: string; smallText?: string }) {
    const smallText =
      typeof detail?.smallText === "string" && detail.smallText.trim()
        ? detail.smallText.trim()
        : resolveUpgradePromptSmallText(detail?.reason);
    setUpgradePromptSmallText(smallText);
    setShowUpgradePrompt(true);
  }

  function handlePricingClick(event: ReactMouseEvent<HTMLAnchorElement>) {
    if (isPricingNavigationPending || event.defaultPrevented) {
      return;
    }

    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    setIsPricingNavigationPending(true);
  }

  function renderUpgradePromptModal() {
    if (!showUpgradePrompt) {
      return null;
    }

    return (
      <motion.div
        className="app-upgrade-backdrop fixed inset-0 z-1000 flex items-center justify-center bg-black/45 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowUpgradePrompt(false)}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="app-card app-upgrade-modal w-full max-w-135 rounded-2xl border border-[#d9cec0] bg-[#fbf6ed] px-6 py-6 shadow-[0_22px_70px_rgba(33,24,12,0.16)]"
          onClick={(event) => event.stopPropagation()}
        >
          <h3 className="app-upgrade-title inline-flex items-center gap-2 text-[31px] leading-[1.05] tracking-[-0.04em] text-[#2f2417] font-[Georgia,serif]">
            <span>
              Go Unlimited with{" "}
              <span style={{ color: "#CFA43A" }}>
                Socratic Plus
              </span>
            </span>
            <PremiumCrownIcon className="text-[36px]" />
          </h3>
          <p className="app-upgrade-copy mt-2 text-[13px] leading-6 text-[#746758]">
            {upgradePromptSmallText}
          </p>
          <div className="mt-5 flex items-center gap-2.5">
            <Link
              href={ROUTES.PRICING}
              onClick={handlePricingClick}
              aria-busy={isPricingNavigationPending}
              className={cn(
                "app-upgrade-primary inline-flex items-center gap-1.5 rounded-[14px] border border-[#e7c98f] bg-[#f4ddb1] px-4 py-2 text-[13px] text-[#302111] transition hover:bg-[#ebd1a3]",
                isPricingNavigationPending && "pointer-events-none opacity-90",
              )}
            >
              View Pricing
              {isPricingNavigationPending ? (
                <RoseCurveLoader className="h-[1.6em] w-[1.6em] !text-black [filter:none]" />
              ) : (
                <ArrowUpRight size={13} />
              )}
            </Link>
            <button
              type="button"
              onClick={() => setShowUpgradePrompt(false)}
              className="app-upgrade-secondary inline-flex rounded-[14px] border border-[#d8ccbc] bg-[#fdf9f2] px-4 py-2 text-[13px] text-[#5f5344] transition hover:bg-[#f4ece0]"
            >
              Keep exploring free
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  async function readRateLimitMessage(response: Response) {
    if (response.status !== 429) {
      return null;
    }

    const retryAfterRaw = response.headers.get("Retry-After");
    const retryAfter = retryAfterRaw ? Number.parseInt(retryAfterRaw, 10) : NaN;
    const resetRaw = response.headers.get("X-RateLimit-Reset");
    const resetAfter = resetRaw ? Number.parseInt(resetRaw, 10) : NaN;

    const waitSeconds =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter
        : Number.isFinite(resetAfter) && resetAfter > 0
          ? resetAfter
          : 5;

    return `Whoa, slow down! Give it ${waitSeconds} seconds, then try again.`;
  }

  function createTempId(prefix: string) {
    tempIdRef.current += 1;
    return `${prefix}-${tempIdRef.current}`;
  }

  function isAbortError(error: unknown) {
    return error instanceof Error && error.name === "AbortError";
  }

  function handleStopStreaming() {
    const activeController = activeStreamControllerRef.current;
    if (!activeController) {
      return;
    }

    activeController.abort();
    activeStreamControllerRef.current = null;
    setMessages((prev) => {
      const targetIndex = [...prev]
        .reverse()
        .findIndex(
          (message) =>
            message.role === "ASSISTANT" &&
            message.id.startsWith("assistant-temp-") &&
            !message.content.trim(),
        );

      if (targetIndex === -1) {
        return prev;
      }

      const absoluteIndex = prev.length - 1 - targetIndex;
      const next = [...prev];
      const target = next[absoluteIndex];

      if (!target) {
        return prev;
      }

      next[absoluteIndex] = {
        ...target,
        content: "Generation stopped.",
      };
      return next;
    });
    setIsStreaming(false);
  }

  async function handleSend(payload: {
    content: string;
    attachments: ChatImageAttachment[];
    webSearch: boolean;
  }) {
    if (isStreaming || isDebateCompleted) return;
    if (!billing.isPremium && (billing.usage.dailyMessagesRemaining ?? 0) <= 0) {
      openUpgradePrompt({ reason: DAILY_MESSAGES_LIMIT_REASON });
      return;
    }
    if (
      !billing.isPremium &&
      payload.attachments.length > 0 &&
      (billing.usage.dailyImageUploadsRemaining ?? 0) <= 0
    ) {
      openUpgradePrompt({ reason: DAILY_IMAGE_UPLOAD_LIMIT_REASON });
      return;
    }

    const tempId = createTempId("temp");
    const startedWithoutSession = !activeSessionId;
    let assistantMessageId: string | null = null;
    const { content, attachments, webSearch } = payload;

    const optimisticMessage: ChatMessage = {
      id: tempId,
      role: "USER",
      content,
      attachments,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      setIsStreaming(true);
      const streamController = new AbortController();
      activeStreamControllerRef.current = streamController;

      const nextAssistantMessageId = createTempId("assistant-temp");
      assistantMessageId = nextAssistantMessageId;

      setMessages((prev) => [
        ...prev,
        {
          id: nextAssistantMessageId,
          role: "ASSISTANT",
          content: "",
          createdAt: new Date().toISOString(),
        },
      ]);

      const res = await fetch("/api/v1/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: streamController.signal,
        body: JSON.stringify({
          sessionId: activeSessionId,
          content,
          attachments,
          webSearch,
          socraticTone: getSocraticToneSetting(),
          ...(activeSessionId
            ? {}
            : pendingRoleplayPhilosopher
              ? {
                  mode: "ROLEPLAY",
                  roleplayPhilosopherId: pendingRoleplayPhilosopher.id,
                }
              : modeSelection === "SOCRATIC"
                ? { mode: "SOCRATIC" }
                : {}),
        }),
      });

      if (!res.ok || !res.body) {
        let rateLimitMessage: string | null = null;
        if (res.status === 402) {
          const reason = await readUpgradeReason(res);
          openUpgradePrompt(reason ? { reason } : undefined);
        } else {
          rateLimitMessage = await readRateLimitMessage(res);
          if (rateLimitMessage) {
            showErrorToast(rateLimitMessage);
          }
        }

        setMessages((prev) =>
          prev.filter(
            (message) =>
              message.id !== assistantMessageId &&
              message.id !== optimisticMessage.id,
          ),
        );
        void refreshBillingState();
        return;
      }

      const returnedSessionId = res.headers.get("X-Session-Id");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);

        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessageId
              ? { ...message, content: `${message.content}${chunk}` }
              : message,
          ),
        );
      }

      const createdSessionFromNewChat =
        startedWithoutSession && Boolean(returnedSessionId);

      if (createdSessionFromNewChat && returnedSessionId) {
        const draftFromNewChat = sessionStorage.getItem("socratic:draft:/app");
        if (draftFromNewChat !== null) {
          sessionStorage.setItem(
            `socratic:draft:/app/${returnedSessionId}`,
            draftFromNewChat,
          );
          sessionStorage.removeItem("socratic:draft:/app");
        }

        setActiveSessionId(returnedSessionId);
        window.history.replaceState(null, "", `/app/${returnedSessionId}`);
        window.dispatchEvent(
          new CustomEvent("socratic:sessions:changed", {
            detail: { activeSessionId: returnedSessionId },
          }),
        );
      }

      void refreshBillingState();
    } catch (error) {
      if (!isAbortError(error)) {
        setMessages((prev) =>
          prev.filter((message) => message.id !== assistantMessageId),
        );
      }
    } finally {
      activeStreamControllerRef.current = null;
      setIsStreaming(false);
    }
  }

  const roleplayIntro = visibleRoleplayPhilosopher ? (
    <div
      className="app-roleplay-thread-intro mb-4 rounded-[18px] border p-3 text-left md:p-4"
      style={
        {
          "--roleplay-accent": visibleRoleplayPhilosopher.accent,
        } as CSSProperties
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="app-roleplay-profile-image relative h-36 w-full shrink-0 overflow-hidden rounded-[14px] bg-[#f1eee7] sm:h-40 sm:w-43 md:w-48">
          <Image
            src={resolveOptimizedCloudinaryPublicAsset(
              visibleRoleplayPhilosopher.imagePath,
              { width: 520, height: 420, crop: "fill", quality: "auto" },
            )}
            alt={`${visibleRoleplayPhilosopher.philosopherName} portrait for Socratic AI roleplay mode`}
            fill
            sizes="(max-width: 640px) 100vw, 192px"
            className="object-cover"
            priority={!activeSessionId}
          />
        </div>
        <div className="app-roleplay-profile-copy min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            {visibleRoleplayPhilosopher.flairs.map((flair) => (
              <span
                key={flair}
                data-flair={flair}
                className="app-roleplay-flair-token app-roleplay-flair-badge rounded-[8px] border px-3.5 py-2 text-[13px] leading-none"
                style={getRoleplayFlairStyle(flair)}
              >
                {flair}
              </span>
            ))}
          </div>
          <h3 className="mt-3 text-[30px] leading-none tracking-[-0.045em] text-slate-950 font-[Georgia,serif] md:text-[36px]">
            {visibleRoleplayPhilosopher.philosopherName}
          </h3>
          <p className="mt-2 max-w-145 text-[13px] leading-5.5 text-slate-600">
            {visibleRoleplayPhilosopher.shortDescription}
          </p>
        </div>
      </div>
    </div>
  ) : null;

  async function handleRegenerate() {
    if (!activeSessionId || isStreaming || isDebateCompleted) return;
    let assistantMessageId: string | null = null;

    try {
      setIsStreaming(true);
      const streamController = new AbortController();
      activeStreamControllerRef.current = streamController;

      const nextAssistantMessageId = createTempId("assistant-temp");
      assistantMessageId = nextAssistantMessageId;

      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: nextAssistantMessageId,
          role: "ASSISTANT",
          content: "",
          createdAt: new Date().toISOString(),
        },
      ]);

      const res = await fetch("/api/v1/chat/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: streamController.signal,
        body: JSON.stringify({
          sessionId: activeSessionId,
          socraticTone: getSocraticToneSetting(),
        }),
      });

      if (!res.ok || !res.body) {
        let rateLimitMessage: string | null = null;
        if (res.status === 402) {
          const reason = await readUpgradeReason(res);
          openUpgradePrompt(reason ? { reason } : undefined);
        } else {
          rateLimitMessage = await readRateLimitMessage(res);
          if (rateLimitMessage) {
            showErrorToast(rateLimitMessage);
          }
        }

        if (res.status !== 402 && !rateLimitMessage) {
          setMessages((prev) =>
            prev.filter((message) => message.id !== assistantMessageId),
          );
        }
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);

        setMessages((prev) =>
          prev.map((message) =>
            message.id === nextAssistantMessageId
              ? { ...message, content: `${message.content}${chunk}` }
              : message,
          ),
        );
      }

    } catch (error) {
      if (!isAbortError(error)) {
        setMessages((prev) =>
          prev.filter((message) => message.id !== assistantMessageId),
        );
      }
    } finally {
      activeStreamControllerRef.current = null;
      setIsStreaming(false);
    }
  }

  function handleEdit(message: ChatMessage) {
    if (isStreaming || isDebateSession) return;
    setEditingMessage(message);
    setEditDraft(message.content);
  }

  function handleEditCancel() {
    if (isStreaming || isDebateSession) return;
    setEditingMessage(null);
    setEditDraft("");
  }

  async function handleEditSubmit() {
    if (!editingMessage || !activeSessionId || isStreaming || isDebateSession)
      return;
    const newContent = editDraft;
    const cutoffIndex = messages.findIndex(
      (message) => message.id === editingMessage.id,
    );
    if (cutoffIndex < 0) return;
    let assistantMessageId: string | null = null;

    try {
      setIsStreaming(true);
      const streamController = new AbortController();
      activeStreamControllerRef.current = streamController;

      const nextAssistantMessageId = createTempId("assistant-temp");
      assistantMessageId = nextAssistantMessageId;

      setMessages((prev) => [
        ...prev.slice(0, cutoffIndex),
        editingMessage.attachments
          ? {
              ...editingMessage,
              content: newContent.trim(),
              attachments: editingMessage.attachments,
            }
          : {
              ...editingMessage,
              content: newContent.trim(),
            },
        {
          id: nextAssistantMessageId,
          role: "ASSISTANT",
          content: "",
          createdAt: new Date().toISOString(),
        },
      ]);

      let messageIdForEdit = editingMessage.id;

      if (messageIdForEdit.startsWith("temp-")) {
        const lookupRes = await fetch(
          `/api/v1/chat/sessions/${activeSessionId}/messages`,
        );
        if (lookupRes.ok) {
          const persistedMessages = (await lookupRes.json()) as ChatMessage[];
          const latestUserMessage = [...persistedMessages]
            .reverse()
            .find((message) => message.role === "USER");

          if (latestUserMessage) {
            messageIdForEdit = latestUserMessage.id;
          }
        }
      }

      const res = await fetch("/api/v1/chat/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: streamController.signal,
        body: JSON.stringify({
          sessionId: activeSessionId,
          messageId: messageIdForEdit,
          newContent,
          socraticTone: getSocraticToneSetting(),
        }),
      });

      if (!res.ok || !res.body) {
        let rateLimitMessage: string | null = null;
        if (res.status === 402) {
          const reason = await readUpgradeReason(res);
          openUpgradePrompt(reason ? { reason } : undefined);
        } else {
          rateLimitMessage = await readRateLimitMessage(res);
          if (rateLimitMessage) {
            showErrorToast(rateLimitMessage);
          }
        }

        if (res.status !== 402 && !rateLimitMessage) {
          setMessages((prev) => prev.slice(0, cutoffIndex));
        }
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);

        setMessages((prev) =>
          prev.map((message) =>
            message.id === nextAssistantMessageId
              ? { ...message, content: `${message.content}${chunk}` }
              : message,
          ),
        );
      }

      setEditingMessage(null);
      setEditDraft("");
    } catch (error) {
      if (!isAbortError(error)) {
        setMessages((prev) => prev.slice(0, cutoffIndex));
      }
    } finally {
      activeStreamControllerRef.current = null;
      setIsStreaming(false);
    }
  }

  useEffect(() => {
    const nextPrompt = initialAutoSendMessage?.trim();

    if (!nextPrompt || autoSendTriggeredRef.current) {
      return;
    }

    if (
      activeSessionId ||
      isStreaming ||
      isDebateCompleted ||
      messages.length > 0
    ) {
      return;
    }

    autoSendTriggeredRef.current = true;
    setModeSelection("SOCRATIC");
    setActiveSessionMeta({ mode: "SOCRATIC" });

    void handleSend({
      content: nextPrompt,
      attachments: [],
      webSearch: false,
    });
  // We intentionally avoid adding handleSend to deps to prevent auto-send replay loops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeSessionId,
    initialAutoSendMessage,
    isDebateCompleted,
    isStreaming,
    messages.length,
  ]);

  if (!hasMessages) {
    return (
      <div
        className={cn(
          "app-new-chat-shell relative flex h-full min-h-0 px-4 md:px-6",
          modeSelection === "ROLEPLAY"
            ? "app-new-chat-roleplay-shell items-start justify-center pt-16 pb-8 md:pt-18"
            : "items-center justify-center",
        )}
      >
        <div className="w-full">
          <div className="fixed top-1.5 left-1/2 z-30 -translate-x-1/2 md:absolute md:-top-1 md:left-6 md:z-10 md:translate-x-0 lg:-top-3 lg:left-4">
            <div ref={modeMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsModeMenuOpen((prev) => !prev)}
                data-app-tour-target="mode-switch"
                className={cn(
                  "app-mode-switch-trigger group inline-flex cursor-pointer items-center gap-2.5 rounded-full border px-3 py-2 text-[14px] transition",
                  isModeMenuOpen && "app-mode-switch-trigger-open",
                )}
              >
                <span className="app-mode-switch-icon">
                  {modeSelection === "SOCRATIC" ? (
                    <GraduationCap size={14} />
                  ) : null}
                  {modeSelection === "DEBATE" ? <Swords size={14} /> : null}
                  {modeSelection === "ROLEPLAY" ? (
                    <ScrollText size={14} />
                  ) : null}
                </span>
                <span className="app-mode-switch-label">
                  {modeSelection === "SOCRATIC"
                    ? "Socratic"
                    : modeSelection === "DEBATE"
                      ? "Debate"
                      : "Roleplay"}
                </span>
                <ChevronDown
                  size={14}
                  className={cn(
                    "app-mode-switch-chevron transition-transform duration-200",
                    isModeMenuOpen ? "rotate-180" : "rotate-0",
                  )}
                />
              </button>

              <AnimatePresence>
                {isModeMenuOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="app-mode-switch-menu absolute left-0 top-full mt-2 flex min-w-42 origin-top flex-col gap-1 rounded-2xl border p-1.5"
                    data-app-tour-target="mode-switch-menu"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        selectNewChatMode("SOCRATIC");
                        setIsModeMenuOpen(showQuickTour);
                      }}
                      data-active={modeSelection === "SOCRATIC"}
                      data-app-tour-target="mode-option-socratic"
                      data-tour-active={
                        showQuickTour &&
                        APP_QUICK_TOUR_STEPS[quickTourStep]?.id === "socratic"
                      }
                      className="app-mode-switch-option inline-flex w-full items-center justify-between gap-3 rounded-[14px] px-2 py-1.5 text-[14px] transition"
                    >
                      <span className="inline-flex items-center gap-2">
                        <GraduationCap size={15} />
                        Socratic
                      </span>
                      {modeSelection === "SOCRATIC" ? (
                        <Check size={14} />
                      ) : null}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!billing.features.debateMode) {
                          openUpgradePrompt();
                          setIsModeMenuOpen(showQuickTour);
                          return;
                        }
                        selectNewChatMode("DEBATE");
                        setIsModeMenuOpen(showQuickTour);
                      }}
                      data-active={modeSelection === "DEBATE"}
                      data-app-tour-target="mode-option-debate"
                      data-tour-active={
                        showQuickTour &&
                        APP_QUICK_TOUR_STEPS[quickTourStep]?.id === "debate"
                      }
                      className="app-mode-switch-option inline-flex w-full items-center justify-between gap-3 rounded-[14px] px-2 py-1.5 text-[14px] transition"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Swords size={15} />
                        Debate
                        {!billing.features.debateMode ? (
                          <Crown size={12} className="text-[#CFA43A]" />
                        ) : null}
                      </span>
                      {modeSelection === "DEBATE" ? <Check size={14} /> : null}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        selectNewChatMode("ROLEPLAY");
                        setIsModeMenuOpen(showQuickTour);
                      }}
                      data-active={modeSelection === "ROLEPLAY"}
                      data-app-tour-target="mode-option-roleplay"
                      data-tour-active={
                        showQuickTour &&
                        APP_QUICK_TOUR_STEPS[quickTourStep]?.id === "roleplay"
                      }
                      className="app-mode-switch-option inline-flex w-full items-center justify-between gap-3 rounded-[14px] px-2 py-1.5 text-[14px] transition"
                    >
                      <span className="inline-flex items-center gap-2">
                        <ScrollText size={15} />
                        Roleplay
                      </span>
                      {modeSelection === "ROLEPLAY" ? (
                        <Check size={14} />
                      ) : null}
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {modeSelection === "SOCRATIC" ? (
              <motion.div
                key="socratic"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mx-auto max-w-190 text-center">
                  <h2
                    className="app-greeting-heading mx-auto max-w-115 text-center text-[34px] font-normal leading-[1.1] tracking-[-0.035em] text-slate-900 font-[Georgia,serif] md:max-w-110 md:text-[33px] md:leading-[1.1] md:tracking-[-0.032em]"
                    style={{ visibility: greetingLine ? "visible" : "hidden" }}
                  >
                    {greetingLine ? (
                      <TypewriterHeading
                        key={greetingLine}
                        text={greetingLine}
                        speedMs={34}
                        className="inline"
                      />
                    ) : (
                      "Clarity is just a few prompts away."
                    )}
                  </h2>
                </div>

                <div className="mt-6 md:mt-7">
                  <MessageInput
                    key={activeSessionId ?? "new-chat"}
                    onSend={handleSend}
                    onRestrictionReached={(reason) =>
                      openUpgradePrompt({ reason })
                    }
                    onStop={handleStopStreaming}
                    isStreaming={isStreaming}
                    isPremium={billing.isPremium}
                    dailyMessagesRemaining={billing.usage.dailyMessagesRemaining}
                    dailyImageUploadsRemaining={
                      billing.usage.dailyImageUploadsRemaining
                    }
                    initialValue={undefined}
                    variant="hero"
                    placeholder={inputPlaceholder}
                  />
                </div>

                <div className="mt-5 flex justify-center">
                  <div className="w-full max-w-120 px-3 md:w-max md:max-w-none md:px-0">
                    <div className="flex flex-col items-center justify-center gap-2 md:flex-row md:gap-2.5 md:whitespace-nowrap">
                      <button
                        key={starterChips[0] ?? "starter-suggestion"}
                        type="button"
                        onClick={() => {
                          const chip = starterChips[0];
                          if (!chip) return;
                          handleSend({
                            content: chip,
                            attachments: [],
                            webSearch: false,
                          });
                        }}
                        disabled={isStreaming || !starterChips[0]}
                        className={`${poppinsClassName} app-suggestion-pill w-full cursor-pointer whitespace-normal rounded-[12px] border border-slate-200 bg-slate-50 px-3.5 py-2 text-[13px] leading-5.5 text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 md:hidden`}
                      >
                        {starterChips[0] ?? ""}
                      </button>

                      {starterChips.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() =>
                            handleSend({
                              content: chip,
                              attachments: [],
                              webSearch: false,
                            })
                          }
                          disabled={isStreaming}
                          className={`${poppinsClassName} app-suggestion-pill hidden cursor-pointer rounded-[12px] border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-[13px] text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 md:inline-flex md:w-auto`}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : modeSelection === "DEBATE" ? (
              <motion.div
                key="debate"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="flex w-full justify-center"
              >
                <DebateModeSetup canAccessDebate={billing.features.debateMode} />
              </motion.div>
            ) : pendingRoleplayPhilosopher ? (
              <motion.div
                key={`roleplay-ready-${pendingRoleplayPhilosopher.id}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mx-auto max-w-160">
                  <div className="mb-2 flex justify-start">
                    <button
                      type="button"
                      onClick={() => setPendingRoleplayId(null)}
                      className="app-change-philosopher-btn app-roleplay-secondary-btn inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] transition hover:bg-slate-50 hover:text-slate-900"
                    >
                      <ArrowLeft size={13} />
                      Back
                    </button>
                  </div>
                  {roleplayIntro}

                  <div className="mb-2.5">
                    <p className="app-roleplay-prompts-label text-[12px] font-semibold">
                      Suggested Messages:
                    </p>
                  </div>
                  <div className="mb-4 grid gap-1.5">
                    {pendingRoleplayPhilosopher.starterPrompts.map((prompt, index) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() =>
                          handleSend({
                            content: prompt,
                            attachments: [],
                            webSearch: false,
                          })
                        }
                        disabled={isStreaming}
                        className="app-roleplay-starter-prompt flex cursor-pointer items-center gap-3 rounded-[12px] border px-3.5 py-2.5 text-left text-[12px] leading-5 transition disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="app-roleplay-prompt-index shrink-0 text-[10px] font-semibold tabular-nums">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span>{prompt}</span>
                      </button>
                    ))}
                  </div>

                  <MessageInput
                    key={`roleplay-${pendingRoleplayPhilosopher.id}`}
                    onSend={handleSend}
                    onRestrictionReached={(reason) =>
                      openUpgradePrompt({ reason })
                    }
                    onStop={handleStopStreaming}
                    isStreaming={isStreaming}
                    isPremium={billing.isPremium}
                    dailyMessagesRemaining={billing.usage.dailyMessagesRemaining}
                    dailyImageUploadsRemaining={
                      billing.usage.dailyImageUploadsRemaining
                    }
                    initialValue={undefined}
                    variant="default"
                    placeholder={inputPlaceholder}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="roleplay"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="flex w-full justify-center"
              >
                <RoleplayModeSetup onChatNow={setPendingRoleplayId} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>{renderUpgradePromptModal()}</AnimatePresence>
        <AnimatePresence>
          {showQuickTour ? (
            <AppQuickTour
              activeStep={quickTourStep}
              onStepChange={moveQuickTourToStep}
              onClose={markQuickTourComplete}
            />
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {errorToast && (
        <div className="pointer-events-none fixed right-4 top-4 z-70">
          <div
            className={cn(
              "flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/96 px-3 py-2 text-[11px] text-amber-900 shadow-[0_14px_34px_rgba(245,158,11,0.2)] backdrop-blur-sm",
              errorToast.isLeaving
                ? "animate-[toastSlideOut_240ms_cubic-bezier(0.4,0,0.2,1)_both]"
                : "animate-[toastSlideIn_220ms_cubic-bezier(0.22,1,0.36,1)_both]",
            )}
          >
            <AlertCircle size={14} className="text-amber-700" />
            <span>{errorToast.message}</span>
          </div>
        </div>
      )}

      <MessageList
        messages={messages}
        onRegenerate={handleRegenerate}
        onEdit={handleEdit}
        onEditCancel={handleEditCancel}
        onEditSubmit={handleEditSubmit}
        onEditDraftChange={setEditDraft}
        isStreaming={isStreaming}
        userLabel={userLabel}
        editingMessageId={editingMessage?.id ?? null}
        editDraft={editDraft}
        disableRevisionActions={isDebateSession}
        topContent={isRoleplaySession ? roleplayIntro : undefined}
      />

      {!isDebateCompleted ? (
        <div className="app-composer-dock sticky bottom-0 z-10 animate-[chatComposerDock_320ms_cubic-bezier(0.22,1,0.36,1)_both] pt-4 pb-2">
          <MessageInput
            key={activeSessionId ?? "new-chat"}
            onSend={handleSend}
            onRestrictionReached={(reason) => openUpgradePrompt({ reason })}
            onStop={handleStopStreaming}
            isStreaming={isStreaming}
            isPremium={billing.isPremium}
            dailyMessagesRemaining={billing.usage.dailyMessagesRemaining}
            dailyImageUploadsRemaining={billing.usage.dailyImageUploadsRemaining}
            initialValue={undefined}
            variant="hero"
            placeholder={inputPlaceholder}
            showWebSearch={!isDebateSession}
            allowImageAttachments={!isDebateSession}
          />
        </div>
      ) : (
        <div className="px-3 pb-10 md:px-4 md:pb-14">
          <div className="mx-auto max-w-170">
            <div className="app-card app-debate-card app-debate-ended-card rounded-3xl border border-[#ddd5c7] bg-[#f7f4ee] px-5 py-5 text-center shadow-[0_16px_42px_rgba(31,27,21,0.08)]">
              <div className="app-debate-status-chip inline-flex items-center gap-2 rounded-md border border-[#d6cec0] bg-transparent px-3 py-1 text-[13px] font-medium text-[#756d60]">
                <Swords size={12} />
                Debate Closed
              </div>

              <h3 className="app-debate-ended-title mt-4 text-[26px] leading-[1.08] tracking-[-0.04em] text-[#1f1b15] font-[Georgia,serif] md:text-[32px]">
                Time up! Debate has ended.
              </h3>

              <p className="app-debate-ended-copy mt-3 text-[13px] leading-6 text-[#6f6658]">
                The clock has run out. Review the Post-Match Report or reveal
                the verdict here.
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                {activeSessionId && (
                  <Link
                    href={`/app/${activeSessionId}/summary`}
                    target="_blank"
                    rel="noreferrer"
                    className="app-debate-ended-primary inline-flex items-center gap-2 rounded-full border border-[#3a3126] bg-[#3a3126] px-4 py-2 text-[13px] text-[#f6f2e8] transition hover:bg-[#30291f] hover:text-[#f6f2e8]"
                  >
                    <ScrollText size={14} />
                    Post-Match Report
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => setShowWinnerReveal((current) => !current)}
                  className="app-debate-ended-secondary inline-flex items-center gap-2 rounded-full border border-[#cfc4b2] bg-[#ece6d9] px-4 py-2 text-[13px] text-[#5d5447] transition hover:bg-[#e5dece] hover:text-[#29231b]"
                >
                  <Crown size={14} />
                  Reveal Winner
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {renderUpgradePromptModal()}

        {showWinnerReveal && completedDebate && (
          <motion.div
            className="app-debate-winner-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWinnerReveal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="app-card app-debate-card app-debate-winner-modal relative w-full max-w-110 rounded-[28px] border border-[#d6cec0] bg-[#f7f4ee] px-5 py-5 text-center shadow-[0_22px_70px_rgba(31,27,21,0.16)]"
              role="dialog"
              aria-modal="true"
              aria-label="Debate winner"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowWinnerReveal(false)}
                className="app-debate-winner-close absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d6cec0] bg-[#f1ecdf] text-[#7a7164] transition hover:bg-[#e5dece] hover:text-[#2a241c]"
                aria-label="Close winner reveal"
              >
                <X size={14} />
              </button>

              <div className="app-debate-winner-chip inline-flex items-center gap-2 rounded-full border border-[#cfbf9f] bg-[#efe4d0] px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-[#7a5f39]">
                <Crown size={12} />
                Winner Revealed
              </div>

              <h3 className="app-debate-winner-title mt-4 text-[30px] leading-[1.04] tracking-[-0.05em] text-[#1f1b15] font-[Georgia,serif]">
                {winnerLabel}
              </h3>

              <p className="app-debate-winner-copy mt-3 text-[14px] leading-7 text-[#6f6658]">
                {completedDebate.verdictSummary ||
                  "The verdict is available in the Post-Match Report."}
              </p>

              <div className="mt-5 flex justify-center">
                {activeSessionId && (
                  <Link
                    href={`/app/${activeSessionId}/summary`}
                    target="_blank"
                    rel="noreferrer"
                    className="app-debate-ended-primary inline-flex items-center gap-2 rounded-full border border-[#3a3126] bg-[#3a3126] px-4 py-2 text-[13px] text-[#f6f2e8] transition hover:bg-[#30291f] hover:text-[#f6f2e8]"
                  >
                    <ScrollText size={14} />
                    Open Post-Match Report
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
