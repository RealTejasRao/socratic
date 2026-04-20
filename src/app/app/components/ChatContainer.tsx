"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import confetti from "canvas-confetti";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
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
  getRoleplayPhilosopherConfig,
  type RoleplayPhilosopherId,
} from "src/lib/roleplay";
import type {
  ChatImageAttachment,
  ChatMessage,
  ChatSessionMeta,
} from "src/types/chat";
import { TypewriterHeading } from "@/src/components/ui/typewriter-heading";
import { SUGGESTION_QUESTIONS } from "@/src/lib/suggestion-questions";
import { resolveOptimizedCloudinaryPublicAsset } from "@/src/lib/cloudinary-public-assets";
import DebateModeSetup from "./DebateModeSetup";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import RoleplayModeSetup from "./RoleplayModeSetup";

interface Props {
  initialMessages: ChatMessage[];
  sessionId?: string;
  sessionMeta?: ChatSessionMeta;
}

const MORNING_GREETINGS = [
  "A new day, a new tabula rasa.",
  "Clarity is just a few prompts away.",
  "Everything's ready, let's begin.",
  "Good morning, {name}.",
];

const AFTERNOON_GREETINGS = [
  "The day is half gone, let's make the second half count.",
  "Peak efficiency mode engaged.",
  "Time is moving, are you?",
  "Good afternoon, {name}.",
];

const EVENING_GREETINGS = [
  "The distractions are winding down. The thinking can begin.",
  "Aristotle did his best work at dusk. Now it's your turn.",
  "The sun sets, {name}. The mind rises.",
  "Good evening, {name}.",
];

const LATE_GREETINGS = [
  "The best philosophers were night owls too.",
  "Seek the light in the dark.",
  "The world's quiet, best time to talk.",
];

const FALLBACK_STARTER_CHIPS = [
  "Why do we fear death if we won't be there to experience it?",
  "Was Socrates right to accept his own death?",
];

const STARTER_CHIP_COUNT = 2;
const poppinsClassName = "[font-family:Poppins,sans-serif]";
const SOCRATIC_TONE_KEY = "socratic:settings:socraticTone";

type ErrorToastState = {
  message: string;
  isLeaving: boolean;
} | null;

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
    return "RUTHLESS_BLUNT";
  }

  try {
    const stored = localStorage.getItem(SOCRATIC_TONE_KEY);
    return isSocraticTone(stored) ? stored : "RUTHLESS_BLUNT";
  } catch {
    return "RUTHLESS_BLUNT";
  }
}

export default function ChatContainer({
  initialMessages,
  sessionId,
  sessionMeta = { mode: "SOCRATIC" },
}: Props) {
  const { user } = useUser();
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
  const [activeSessionId, setActiveSessionId] = useState(sessionId);
  const tempIdRef = useRef(0);
  const activeStreamControllerRef = useRef<AbortController | null>(null);
  const finalizeRequestedRef = useRef(false);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const hasMessages = messages.length > 0;
  const isDebateSession = activeSessionMeta.mode === "DEBATE";
  const isRoleplaySession = activeSessionMeta.mode === "ROLEPLAY";
  const isDebateCompleted = activeSessionMeta.debate?.status === "COMPLETED";
  const completedDebate = isDebateCompleted ? activeSessionMeta.debate : null;
  const rawName = user?.firstName?.trim() || user?.username?.trim() || "friend";
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
        tradition: activeRoleplayPhilosopher.tradition,
        introBlurb: activeRoleplayPhilosopher.introBlurb,
      }
    : pendingRoleplayPhilosopher
      ? {
          philosopherId: pendingRoleplayPhilosopher.id,
          philosopherName: pendingRoleplayPhilosopher.name,
          imagePath: pendingRoleplayPhilosopher.imagePath,
          tradition: pendingRoleplayPhilosopher.tradition,
          introBlurb: pendingRoleplayPhilosopher.introBlurb,
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
      ? "Write a message to start the conversation."
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

  useEffect(() => {
    setActiveSessionMeta(sessionMeta);
  }, [sessionMeta]);

  useEffect(() => {
    setActiveSessionId(sessionId);
  }, [sessionId]);

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
      setModeSelection("SOCRATIC");
      setActiveSessionMeta({ mode: "SOCRATIC" });
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
    if (!isModeMenuOpen) {
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
  }, [isModeMenuOpen]);

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
    const tempId = createTempId("temp");
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
        const rateLimitMessage = await readRateLimitMessage(res);
        if (rateLimitMessage) {
          showErrorToast(rateLimitMessage);
        }

        setMessages((prev) =>
          prev.filter(
            (message) =>
              message.id !== assistantMessageId &&
              message.id !== optimisticMessage.id,
          ),
        );
        if (!rateLimitMessage) {
          router.refresh();
        }
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
        !activeSessionId && Boolean(returnedSessionId);

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
        router.replace(`/app/${returnedSessionId}`);
      }

      router.refresh();
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
    <div className="app-roleplay-thread-intro mb-8 flex flex-col items-center text-center">
      <div className="relative h-20 w-20 overflow-hidden rounded-full border border-slate-200 bg-[#f5f3ee] shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
        <Image
          src={resolveOptimizedCloudinaryPublicAsset(
            visibleRoleplayPhilosopher.imagePath,
            { width: 240, height: 240, crop: "fill", quality: "auto" },
          )}
          alt={visibleRoleplayPhilosopher.philosopherName}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>
      <h3 className="mt-4 text-[28px] leading-none tracking-[-0.05em] text-slate-950 font-[Georgia,serif]">
        {visibleRoleplayPhilosopher.philosopherName}
      </h3>
      <div className="mt-3 inline-flex items-center rounded-full bg-white px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
        {visibleRoleplayPhilosopher.tradition}
      </div>
      <p className="mt-4 max-w-155 text-[14px] leading-7 text-slate-600">
        {visibleRoleplayPhilosopher.introBlurb}
      </p>
    </div>
  ) : null;

  async function handleRegenerate() {
    if (!activeSessionId || isStreaming || isDebateCompleted) return;

    try {
      setIsStreaming(true);
      const streamController = new AbortController();
      activeStreamControllerRef.current = streamController;

      const assistantMessageId = createTempId("assistant-temp");

      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: assistantMessageId,
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
        const rateLimitMessage = await readRateLimitMessage(res);
        if (rateLimitMessage) {
          showErrorToast(rateLimitMessage);
        }

        if (!rateLimitMessage) {
          router.refresh();
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
            message.id === assistantMessageId
              ? { ...message, content: `${message.content}${chunk}` }
              : message,
          ),
        );
      }

      router.refresh();
    } catch (error) {
      if (!isAbortError(error)) {
        router.refresh();
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

    try {
      setIsStreaming(true);
      const streamController = new AbortController();
      activeStreamControllerRef.current = streamController;

      const index = messages.findIndex(
        (message) => message.id === editingMessage.id,
      );
      const assistantMessageId = createTempId("assistant-temp");

      setMessages((prev) => [
        ...prev.slice(0, index),
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
          id: assistantMessageId,
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
        const rateLimitMessage = await readRateLimitMessage(res);
        if (rateLimitMessage) {
          showErrorToast(rateLimitMessage);
        }

        if (!rateLimitMessage) {
          router.refresh();
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
            message.id === assistantMessageId
              ? { ...message, content: `${message.content}${chunk}` }
              : message,
          ),
        );
      }

      setEditingMessage(null);
      setEditDraft("");
      router.refresh();
    } catch (error) {
      if (!isAbortError(error)) {
        router.refresh();
      }
    } finally {
      activeStreamControllerRef.current = null;
      setIsStreaming(false);
    }
  }

  if (!hasMessages) {
    return (
      <div className="relative flex h-full min-h-0 items-center justify-center px-4 md:px-6">
        <div className="w-full">
          <div className="fixed top-1.5 left-1/2 z-30 -translate-x-1/2 md:absolute md:-top-1 md:left-6 md:z-10 md:translate-x-0 lg:-top-3 lg:left-4">
            <div ref={modeMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsModeMenuOpen((prev) => !prev)}
                className={cn(
                  "app-mode-switch-trigger group inline-flex cursor-pointer items-center gap-2 rounded-full border px-2.5 py-1.5 text-[11px] transition",
                  isModeMenuOpen && "app-mode-switch-trigger-open",
                )}
              >
                <span className="app-mode-switch-icon">
                  {modeSelection === "SOCRATIC" ? (
                    <GraduationCap size={12} />
                  ) : null}
                  {modeSelection === "DEBATE" ? <Swords size={12} /> : null}
                  {modeSelection === "ROLEPLAY" ? (
                    <ScrollText size={12} />
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
                  size={12}
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
                    className="app-mode-switch-menu absolute left-0 top-full mt-2 min-w-42 origin-top rounded-2xl border p-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setModeSelection("SOCRATIC");
                        setIsModeMenuOpen(false);
                      }}
                      data-active={modeSelection === "SOCRATIC"}
                      className="app-mode-switch-option inline-flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-[11px] transition"
                    >
                      <span className="inline-flex items-center gap-2">
                        <GraduationCap size={13} />
                        Socratic
                      </span>
                      {modeSelection === "SOCRATIC" ? (
                        <Check size={12} />
                      ) : null}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setModeSelection("DEBATE");
                        setIsModeMenuOpen(false);
                      }}
                      data-active={modeSelection === "DEBATE"}
                      className="app-mode-switch-option inline-flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-[11px] transition"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Swords size={13} />
                        Debate
                      </span>
                      {modeSelection === "DEBATE" ? <Check size={12} /> : null}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setModeSelection("ROLEPLAY");
                        setIsModeMenuOpen(false);
                      }}
                      data-active={modeSelection === "ROLEPLAY"}
                      className="app-mode-switch-option inline-flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-[11px] transition"
                    >
                      <span className="inline-flex items-center gap-2">
                        <ScrollText size={13} />
                        Roleplay
                      </span>
                      {modeSelection === "ROLEPLAY" ? (
                        <Check size={12} />
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
                    className="app-greeting-heading mx-auto max-w-110 text-center text-[32px] font-normal leading-[1.1] tracking-[-0.035em] text-slate-900 font-[Georgia,serif] md:max-w-100 md:text-[30px] md:leading-[1.12] md:tracking-[-0.03em]"
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
                    onStop={handleStopStreaming}
                    isStreaming={isStreaming}
                    initialValue={undefined}
                    variant="hero"
                    placeholder={inputPlaceholder}
                  />
                </div>

                <div className="mt-4 flex justify-center">
                  <div className="w-full max-w-110 px-3 md:w-max md:max-w-none md:px-0">
                    <div className="flex flex-col items-center justify-center gap-2 md:flex-row md:gap-2 md:whitespace-nowrap">
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
                        className={`${poppinsClassName} app-suggestion-pill w-full cursor-pointer whitespace-normal rounded-[12px] border border-slate-300 bg-[#262624] px-3 py-2 text-[11px] leading-5 text-slate-200 transition hover:border-slate-200 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 md:hidden`}
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
                          className={`${poppinsClassName} app-suggestion-pill hidden cursor-pointer rounded-[10px] border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 md:inline-flex md:w-auto`}
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
                <DebateModeSetup />
              </motion.div>
            ) : pendingRoleplayPhilosopher ? (
              <motion.div
                key={`roleplay-ready-${pendingRoleplayPhilosopher.id}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mx-auto max-w-170">
                  <div className="mb-3 flex justify-start -ml-30">
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
                  <MessageInput
                    key={`roleplay-${pendingRoleplayPhilosopher.id}`}
                    onSend={handleSend}
                    onStop={handleStopStreaming}
                    isStreaming={isStreaming}
                    initialValue={undefined}
                    variant="hero"
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
            onStop={handleStopStreaming}
            isStreaming={isStreaming}
            initialValue={undefined}
            placeholder={inputPlaceholder}
            showWebSearch={!isDebateSession}
            allowImageAttachments={!isDebateSession}
          />
        </div>
      ) : (
        <div className="px-3 pb-10 md:px-4 md:pb-14">
          <div className="mx-auto max-w-170">
            <div className="app-card app-debate-ended-card rounded-3xl border border-slate-200 bg-white px-5 py-5 text-center shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                <Swords size={12} />
                Debate Closed
              </div>

              <h3 className="app-debate-ended-title mt-4 text-[24px] leading-[1.08] tracking-[-0.04em] text-slate-950 font-[Georgia,serif] md:text-[30px]">
                Time up! Debate has ended.
              </h3>

              <p className="app-debate-ended-copy mt-3 text-[12px] leading-6 text-slate-500">
                The clock has run out. Review the full summary or reveal the
                verdict here.
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                {activeSessionId && (
                  <Link
                    href={`/app/${activeSessionId}/summary`}
                    target="_blank"
                    rel="noreferrer"
                    className="app-debate-ended-primary inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-[12px] text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                  >
                    <ScrollText size={14} />
                    Show summary
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => setShowWinnerReveal((current) => !current)}
                  className="app-debate-ended-secondary inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-[12px] text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
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
              className="app-card app-debate-winner-modal relative w-full max-w-110 rounded-[28px] border border-slate-200 bg-white px-5 py-5 text-center shadow-[0_22px_70px_rgba(15,23,42,0.16)]"
              role="dialog"
              aria-modal="true"
              aria-label="Debate winner"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowWinnerReveal(false)}
                className="app-debate-winner-close absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Close winner reveal"
              >
                <X size={14} />
              </button>

              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-amber-700">
                <Crown size={12} />
                Winner Revealed
              </div>

              <h3 className="app-debate-winner-title mt-4 text-[28px] leading-[1.04] tracking-[-0.05em] text-slate-950 font-[Georgia,serif]">
                {winnerLabel}
              </h3>

              <p className="app-debate-winner-copy mt-3 text-[13px] leading-6 text-slate-600">
                {completedDebate.verdictSummary ||
                  "The verdict is available in the full summary."}
              </p>

              <div className="mt-5 flex justify-center">
                {activeSessionId && (
                  <Link
                    href={`/app/${activeSessionId}/summary`}
                    target="_blank"
                    rel="noreferrer"
                    className="app-debate-ended-primary inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-[12px] text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                  >
                    <ScrollText size={14} />
                    Open full summary
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
