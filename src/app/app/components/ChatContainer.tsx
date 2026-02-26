"use client";

import { useState } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import type { ChatMessage } from "src/types/chat";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

interface Props {
  initialMessages: ChatMessage[];
  sessionId?: string;
}

export default function ChatContainer({ initialMessages, sessionId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const router = useRouter();

  async function handleSend(content: string) {
    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      id: tempId,
      role: "USER" as const,
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const res = await fetch("/api/v1/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content }),
      });

      const data = await res.json();

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, id: data.userMessage.id } : msg,
        ),
      );

      // Append assistant
      setMessages((prev) => [
        ...prev,
        {
          id: data.assistantMessage.id,
          role: "ASSISTANT",
          content: data.assistantMessage.content,
          createdAt: data.assistantMessage.createdAt,
        },
      ]);

      if (!sessionId && data.sessionId) {
        router.push(`/app/${data.sessionId}`);
        router.refresh();
      }
    } catch (err) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    }
  }

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} />
      <div className="mt-4">
        <MessageInput onSend={handleSend} />
      </div>
    </div>
  );
}
