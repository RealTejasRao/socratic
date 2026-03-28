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
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 pb-6 pt-1">
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
              <div className="mb-1.5 px-1 text-xs font-medium text-slate-400">
                {isUser ? "You" : "Script"}
              </div>

              <div
                className={cn(
                  "max-w-3xl whitespace-pre-wrap rounded-2xl border px-4 py-3 text-sm leading-7",
                  isUser
                    ? "border-sky-200 bg-sky-50 text-slate-900"
                    : "border-slate-200 bg-white text-slate-800",
                )}
              >
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {message.attachments.map((attachment, attachmentIndex) => (
                      <a
                        key={`${attachment.name}-${attachmentIndex}`}
                        href={attachment.dataUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-xl border border-slate-200 bg-white"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={attachment.dataUrl}
                          alt={attachment.name}
                          className="h-28 w-28 object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}
                {isAssistant && !message.content ? <ThinkingBubble /> : message.content}
              </div>

              <div className="mt-2 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => handleCopy(message.id, message.content)}
                  className="rounded-full border border-slate-300 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  aria-label="Copy message"
                >
                  {copiedMessageId === message.id ? <Check size={15} /> : <Copy size={15} />}
                </button>

                {isAssistant && isLastAssistant && (
                  <button
                    onClick={onRegenerate}
                    disabled={isStreaming}
                    className={cn(
                      "rounded-full border border-slate-300 bg-white p-2",
                      isStreaming
                        ? "cursor-not-allowed opacity-40"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                    )}
                    aria-label="Regenerate response"
                  >
                    <RotateCcw size={15} />
                  </button>
                )}

                {isUser && isLastUser && (
                  <button
                    onClick={() => onEdit(message)}
                    disabled={isStreaming}
                    className={cn(
                      "rounded-full border border-slate-300 bg-white p-2",
                      isStreaming
                        ? "cursor-not-allowed opacity-40"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                    )}
                    aria-label="Edit message"
                  >
                    <Pencil size={15} />
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
