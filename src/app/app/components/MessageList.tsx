"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "src/types/chat";
import ThinkingBubble from "./ThinkingBubble";
import { RotateCcw } from "lucide-react";

interface Props {
  messages: ChatMessage[];
  onRegenerate: () => void;
  isStreaming: boolean;
}

export default function MessageList({
  messages,
  onRegenerate,
  isStreaming,
}: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
      {messages.map((message, index) => {
        const isLast = index === messages.length - 1;
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
              className={`group p-3 rounded max-w-xl ${
                isUser ? "bg-blue-100 text-black" : "bg-gray-100 text-black"
              }`}
            >
              {isAssistant && !message.content ? (
                <ThinkingBubble />
              ) : (
                message.content
              )}
            </div>

            {/* regenerate icon under bubble */}
            {isAssistant && isLast && (
              <div className="mt-1 self-end">
                <button
                  onClick={onRegenerate}
                  disabled={isStreaming}
                  className={`p-1.5 rounded-full transition
      ${isStreaming ? "opacity-40 cursor-not-allowed" : "hover:bg-white/20"}
      bg-white/10
    `}
                >
                  <RotateCcw size={16} className="text-white" />
                </button>
              </div>
            )}
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}
