"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import type { ChatImageAttachment, ChatMessage } from "src/types/chat";
import { TypewriterHeading } from "@/src/components/ui/typewriter-heading";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";

interface Props {
  initialMessages: ChatMessage[];
  sessionId?: string;
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

const STARTER_CHIPS = [
  "Why do we fear death if we won't be there to experience it?",
  "Was Socrates right to accept his own death?",
];

let greetingSeedStore = 0;
const greetingSeedListeners = new Set<() => void>();

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

export default function ChatContainer({ initialMessages, sessionId }: Props) {
  const { user } = useUser();
  const greetingSeed = useSyncExternalStore(
    subscribeToGreetingSeed,
    getGreetingSeedSnapshot,
    () => 0,
  );
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const tempIdRef = useRef(0);
  const router = useRouter();
  const hasMessages = messages.length > 0;
  const rawName = user?.firstName?.trim() || user?.username?.trim() || "there";
  const name = rawName.length > 0 ? rawName : "there";
  const inputPlaceholder =
    name === "there" ? "What's on your mind?" : `What's on your mind, ${name}?`;
  const greetingLine = (() => {
    if (greetingSeed === 0) {
      return "";
    }

    const bucket = getGreetingBucket(new Date().getHours());
    const template = bucket[greetingSeed % bucket.length] ?? "Clarity is just a few prompts away.";

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
    if (isStreaming) return;
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

      const returnedSessionId = res.headers.get("X-Session-Id");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader!.read();
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
    if (!sessionId || isStreaming) return;

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

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader!.read();
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
    if (isStreaming) return;
    setEditingMessage(message);
  }

  async function handleEditSubmit(payload: {
    content: string;
    attachments: ChatImageAttachment[];
    webSearch: boolean;
  }) {
    if (!editingMessage || !sessionId || isStreaming) return;
    const newContent = payload.content;

    setIsStreaming(true);

    const index = messages.findIndex((message) => message.id === editingMessage.id);
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
      const lookupRes = await fetch(`/api/v1/chat/sessions/${sessionId}/messages`);
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

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader!.read();
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
    setIsStreaming(false);
    router.refresh();
  }

  if (!hasMessages) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center">
        <div className="w-full max-w-3xl">
          <div className="text-center">
            <h2
              className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl"
              style={{ visibility: greetingLine ? "visible" : "hidden" }}
            >
              {greetingLine ? (
                <TypewriterHeading key={greetingLine} text={greetingLine} speedMs={34} />
              ) : (
                "Clarity is just a few prompts away."
              )}
            </h2>
          </div>

          <div className="mt-7 md:mt-8">
            <MessageInput
              key={editingMessage?.id ?? sessionId ?? "new-chat"}
              onSend={editingMessage ? handleEditSubmit : handleSend}
              isStreaming={isStreaming}
              initialValue={editingMessage?.content}
              variant="hero"
              placeholder={inputPlaceholder}
            />
          </div>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {STARTER_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleSend({ content: chip, attachments: [], webSearch: false })}
                disabled={isStreaming}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>
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
        isStreaming={isStreaming}
      />

      <div className="animate-[chatComposerDock_320ms_cubic-bezier(0.22,1,0.36,1)_both] pt-3 pb-1">
        <MessageInput
          key={editingMessage?.id ?? sessionId ?? "new-chat"}
          onSend={editingMessage ? handleEditSubmit : handleSend}
          isStreaming={isStreaming}
          initialValue={editingMessage?.content}
          placeholder={inputPlaceholder}
        />
      </div>
    </div>
  );
}
