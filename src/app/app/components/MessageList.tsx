"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "src/types/chat";
interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: Date;
}

interface Props {
  messages: ChatMessage[];
}

export default function MessageList({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`p-3 rounded max-w-xl ${
            message.role === "USER" ? "bg-blue-100 ml-auto" : "bg-gray-100"
          }`}
        >
          {message.content}
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
