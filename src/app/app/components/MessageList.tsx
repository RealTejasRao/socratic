"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Pencil, RotateCcw } from "lucide-react";
import type { ChatMessage } from "src/types/chat";
import ThinkingBubble from "./ThinkingBubble";
import { cn } from "@/src/lib/utils";

interface Props {
  messages: ChatMessage[];
  onRegenerate: () => void;
  onEdit: (message: ChatMessage) => void;
  isStreaming: boolean;
}

export default function MessageList({
  messages,
  onRegenerate,
  onEdit,
  isStreaming,
}: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  async function handleCopy(messageId: string, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 1200);
    } catch {}
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const lastUserIndex = [...messages]
    .reverse()
    .findIndex((message) => message.role === "USER");

  const actualLastUserIndex =
    lastUserIndex === -1 ? -1 : messages.length - 1 - lastUserIndex;

  const lastAssistantIndex = [...messages]
    .reverse()
    .findIndex((message) => message.role === "ASSISTANT");

  const actualLastAssistantIndex =
    lastAssistantIndex === -1 ? -1 : messages.length - 1 - lastAssistantIndex;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-6 pt-2">
        {messages.map((message, index) => {
          const isLastUser = index === actualLastUserIndex;
          const isLastAssistant = index === actualLastAssistantIndex;
          const isAssistant = message.role === "ASSISTANT";
          const isUser = message.role === "USER";

          return (
            <div
              key={message.id}
              className={cn("group flex flex-col", isUser ? "items-end" : "items-start")}
            >
              <div className="mb-2 flex items-center gap-2 px-1 text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                <span>{isUser ? "You" : "Socratic"}</span>
              </div>

              <div
                className={cn(
                  "max-w-3xl whitespace-pre-wrap rounded-[28px] px-5 py-4 text-[15px] leading-7 shadow-[0_18px_60px_rgba(15,23,42,0.08)]",
                  isUser
                    ? "rounded-br-md bg-[linear-gradient(135deg,rgba(53,57,60,1),rgba(34,40,43,1))] text-white"
                    : "rounded-bl-md border border-border/70 bg-background/88 text-foreground backdrop-blur-sm",
                )}
              >
                {isAssistant && !message.content ? <ThinkingBubble /> : message.content}
              </div>

              <div className="mt-2 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => handleCopy(message.id, message.content)}
                  className="rounded-full border border-border/70 bg-background/80 p-2 text-muted-foreground transition hover:border-border hover:bg-background hover:text-foreground"
                  aria-label="Copy message"
                >
                  {copiedMessageId === message.id ? (
                    <Check size={16} className="text-green-600" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>

                {isAssistant && isLastAssistant && (
                  <button
                    onClick={onRegenerate}
                    disabled={isStreaming}
                    className={cn(
                      "rounded-full border border-border/70 bg-background/80 p-2 transition",
                      isStreaming
                        ? "cursor-not-allowed opacity-40"
                        : "text-muted-foreground hover:border-border hover:bg-background hover:text-foreground",
                    )}
                    aria-label="Regenerate response"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}

                {isUser && isLastUser && (
                  <button
                    onClick={() => onEdit(message)}
                    disabled={isStreaming}
                    className={cn(
                      "rounded-full border border-border/70 bg-background/80 p-2 transition",
                      isStreaming
                        ? "cursor-not-allowed opacity-40"
                        : "text-muted-foreground hover:border-border hover:bg-background hover:text-foreground",
                    )}
                    aria-label="Edit message"
                  >
                    <Pencil size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
