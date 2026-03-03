"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "src/types/chat";
import ThinkingBubble from "./ThinkingBubble";
import { RotateCcw, Pencil, Copy, Check } from "lucide-react";

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
    .findIndex((m) => m.role === "USER");

  const actualLastUserIndex =
    lastUserIndex === -1 ? -1 : messages.length - 1 - lastUserIndex;


  const lastAssistantIndex = [...messages]
    .reverse()
    .findIndex((m) => m.role === "ASSISTANT");

  const actualLastAssistantIndex =
    lastAssistantIndex === -1 ? -1 : messages.length - 1 - lastAssistantIndex;

  return (
    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
      {messages.map((message, index) => {
        const isLastUser = index === actualLastUserIndex;
        const isLastAssistant = index === actualLastAssistantIndex;
        const isAssistant = message.role === "ASSISTANT";
        const isUser = message.role === "USER";

        return (
          <div
            key={message.id}
            className={`group flex flex-col w-fit ${
              isUser ? "ml-auto items-end" : "items-start"
            }`}
          >
            {/* chat bubble */}
            <div
              className={`p-3 rounded max-w-xl break-words ${
                isUser ? "bg-blue-100 text-black" : "bg-gray-100 text-black"
              }`}
            >
              {isAssistant && !message.content ? (
                <ThinkingBubble />
              ) : (
                message.content
              )}
            </div>

    
            <div
              className={`mt-1 flex gap-2 opacity-0 group-hover:opacity-100 transition ${
                isAssistant ? "self-end" : ""
              }`}
            >
              <button
                onClick={() => handleCopy(message.id, message.content)}
                className="p-1.5 rounded-full transition hover:bg-gray-200 cursor-pointer"
                aria-label="Copy message"
              >
                {copiedMessageId === message.id ? (
                  <Check size={16} className="text-green-600" />
                ) : (
                  <Copy size={16} />
                )}
              </button>

              {/* regenerate only on last assistant */}
              {isAssistant && isLastAssistant && (
                <button
                  onClick={onRegenerate}
                  disabled={isStreaming}
                  className={`p-1.5 rounded-full transition ${
                    isStreaming
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-gray-200 cursor-pointer"
                  }`}
                >
                  <RotateCcw size={16} />
                </button>
              )}

              {/* edit only on last user */}
              {isUser && isLastUser && (
                <button
                  onClick={() => onEdit(message)}
                  disabled={isStreaming}
                  className={`p-1.5 rounded-full transition ${
                    isStreaming
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-gray-200 cursor-pointer"
                  }`}
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
  );
}
