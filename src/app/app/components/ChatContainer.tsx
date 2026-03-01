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
  const [isStreaming, setIsStreaming] = useState(false);

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
      setIsStreaming(true);

      const res = await fetch("/api/v1/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      let assistantMessageId = `assistant-temp-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "ASSISTANT",
          content: "",
          createdAt: new Date().toISOString(),
        },
      ]);

      let assistantContent = "";

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);

        for (const char of chunk) {
          assistantContent += char;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: assistantContent }
                : msg,
            ),
          );

          // delay
          await new Promise((r) => setTimeout(r, 10));
        }
      }

      setIsStreaming(false);
      router.refresh();
    } catch (err) {
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} />
      <div className="mt-4">
        <MessageInput onSend={handleSend} isStreaming={isStreaming} />
      </div>
    </div>
  );
}
