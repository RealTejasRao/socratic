"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { Swords } from "lucide-react";
import { cn } from "@/src/lib/utils";
import type {
  ChatImageAttachment,
  ChatMessage,
  ChatSessionMeta,
} from "src/types/chat";
import { TypewriterHeading } from "@/src/components/ui/typewriter-heading";
import { SUGGESTION_QUESTIONS } from "@/src/lib/suggestion-questions";
import DebateModeSetup from "./DebateModeSetup";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";

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
  const [modeSelection, setModeSelection] = useState<"SOCRATIC" | "DEBATE">(
    sessionMeta.mode,
  );
  const [activeSessionMeta] = useState<ChatSessionMeta>(sessionMeta);
  const tempIdRef = useRef(0);
  const router = useRouter();
  const hasMessages = messages.length > 0;
  const isDebateSession = activeSessionMeta.mode === "DEBATE";
  const isDebateCompleted = activeSessionMeta.debate?.status === "COMPLETED";
  const rawName = user?.firstName?.trim() || user?.username?.trim() || "friend";
  const name = rawName.length > 0 ? rawName : "friend";
  const userLabel = name === "friend" ? "You" : name;
  const inputPlaceholder = isDebateSession
    ? "Defend your side."
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

  function createTempId(prefix: string) {
    tempIdRef.current += 1;
    return `${prefix}-${tempIdRef.current}`;
  }

  async function handleSend(payload: {
    content: string;
    attachments: ChatImageAttachment[];
    webSearch: boolean;
  }) {
    if (isStreaming || isDebateCompleted) return;
    const tempId = createTempId("temp");
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

      const assistantMessageId = createTempId("assistant-temp");

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "ASSISTANT",
          content: "",
          createdAt: new Date().toISOString(),
        },
      ]);

      const res = await fetch("/api/v1/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content, attachments, webSearch }),
      });

      if (!res.ok || !res.body) {
        setMessages((prev) =>
          prev.filter(
            (message) =>
              message.id !== assistantMessageId && message.id !== optimisticMessage.id,
          ),
        );
        setIsStreaming(false);
        router.refresh();
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

      if (!sessionId && returnedSessionId) {
        const draftFromNewChat = sessionStorage.getItem("socratic:draft:/app");
        if (draftFromNewChat !== null) {
          sessionStorage.setItem(
            `socratic:draft:/app/${returnedSessionId}`,
            draftFromNewChat,
          );
          sessionStorage.removeItem("socratic:draft:/app");
        }

        router.push(`/app/${returnedSessionId}`);
      }

      setIsStreaming(false);
      router.refresh();
    } catch {
      setIsStreaming(false);
    }
  }

  async function handleRegenerate() {
    if (!sessionId || isStreaming || isDebateCompleted) return;

    setIsStreaming(true);

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
      body: JSON.stringify({ sessionId }),
    });

    if (!res.ok || !res.body) {
      setIsStreaming(false);
      router.refresh();
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

    setIsStreaming(false);
    router.refresh();
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
    if (!editingMessage || !sessionId || isStreaming || isDebateSession) return;
    const newContent = editDraft;

    setIsStreaming(true);

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
        `/api/v1/chat/sessions/${sessionId}/messages`,
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
      body: JSON.stringify({
        sessionId,
        messageId: messageIdForEdit,
        newContent,
      }),
    });

    if (!res.ok || !res.body) {
      setIsStreaming(false);
      router.refresh();
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
    setIsStreaming(false);
    router.refresh();
  }

  if (!hasMessages) {
    return (
      <div className="relative flex h-full min-h-0 items-center justify-center px-4 md:px-6">
        <div className="w-full">
          <div className="absolute -top-2.5 left-4 z-10 md:left-6 md:-top-3">
            <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setModeSelection("SOCRATIC")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[11px] transition",
                  modeSelection === "SOCRATIC"
                    ? "bg-black text-white"
                    : "text-zinc-600 hover:text-black",
                )}
              >
                Socratic
              </button>
              <button
                type="button"
                onClick={() => setModeSelection("DEBATE")}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] transition",
                  modeSelection === "DEBATE"
                    ? "bg-black text-white"
                    : "text-zinc-600 hover:text-black",
                )}
              >
                <Swords size={13} />
                Debate
              </button>
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
                    className="app-greeting-heading mx-auto max-w-100 text-center text-[24px] font-normal leading-[1.12] tracking-[-0.03em] text-slate-900 font-[Georgia,serif] md:text-[30px]"
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
                    key={sessionId ?? "new-chat"}
                    onSend={handleSend}
                    isStreaming={isStreaming}
                    initialValue={undefined}
                    variant="hero"
                    placeholder={inputPlaceholder}
                  />
                </div>

                <div className="mt-4 flex justify-center">
                  <div className="flex w-max items-center justify-center gap-2 whitespace-nowrap">
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
                        className={`${poppinsClassName} app-suggestion-pill shrink-0 cursor-pointer rounded-[10px] border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
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
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
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
      />

      {!isDebateCompleted && (
        <div className="app-composer-dock sticky bottom-0 z-10 animate-[chatComposerDock_320ms_cubic-bezier(0.22,1,0.36,1)_both] pt-4 pb-2">
          <MessageInput
            key={sessionId ?? "new-chat"}
            onSend={handleSend}
            isStreaming={isStreaming}
            initialValue={undefined}
            placeholder={inputPlaceholder}
            showWebSearch={!isDebateSession}
          />
        </div>
      )}
    </div>
  );
}




