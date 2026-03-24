"use client";

import { useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ChatMessage } from "src/types/chat";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import { Button } from "@/src/components/ui/button";

interface Props {
  initialMessages: ChatMessage[];
  sessionId?: string;
}

const STARTER_PROMPTS = [
  "Help me unpack a difficult belief I keep returning to.",
  "Challenge my current plan with Socratic questions before I act.",
  "Compare Stoicism and existentialism on how to respond to anxiety.",
];

export default function ChatContainer({ initialMessages, sessionId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const tempIdRef = useRef(0);
  const router = useRouter();

  function createTempId(prefix: string) {
    tempIdRef.current += 1;
    return `${prefix}-${tempIdRef.current}`;
  }

  async function handleSend(content: string) {
    if (isStreaming) return;
    const tempId = createTempId("temp");

    const optimisticMessage: ChatMessage = {
      id: tempId,
      role: "USER",
      content,
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
        body: JSON.stringify({ sessionId, content }),
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

  async function handleEditSubmit(newContent: string) {
    if (!editingMessage || !sessionId || isStreaming) return;

    setIsStreaming(true);

    const index = messages.findIndex((message) => message.id === editingMessage.id);
    const assistantMessageId = createTempId("assistant-temp");

    setMessages((prev) => [
      ...prev.slice(0, index),
      {
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

  return (
    <div className="flex h-full flex-col">
      {messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-4xl">
            <div className="rounded-[36px] border border-border/60 bg-background/75 px-6 py-8 shadow-[0_28px_100px_rgba(15,23,42,0.08)] backdrop-blur-xl md:px-10 md:py-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-xs uppercase tracking-[0.28em] text-muted-foreground">
                <Sparkles size={14} />
                Deliberate conversation
              </div>
              <h3 className="mt-6 max-w-2xl text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                Build a calmer chat space that rewards better questions.
              </h3>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                Start with a prompt below or write your own. The interface is tuned for
                long-form thinking, editing, and revisiting past threads without losing
                the thread.
              </p>

              <div className="mt-8 grid gap-3 md:grid-cols-3">
                {STARTER_PROMPTS.map((prompt) => (
                  <Button
                    key={prompt}
                    variant="outline"
                    className="h-auto min-h-28 justify-start rounded-[24px] px-5 py-4 text-left whitespace-normal"
                    onClick={() => handleSend(prompt)}
                    disabled={isStreaming}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <MessageList
          messages={messages}
          onRegenerate={handleRegenerate}
          onEdit={handleEdit}
          isStreaming={isStreaming}
        />
      )}

      <div className="mt-4 md:mt-6">
        <MessageInput
          key={editingMessage?.id ?? sessionId ?? "new-chat"}
          onSend={editingMessage ? handleEditSubmit : handleSend}
          isStreaming={isStreaming}
          initialValue={editingMessage?.content}
        />
      </div>
    </div>
  );
}
