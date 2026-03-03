"use client";

import { useState } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import type { ChatMessage } from "src/types/chat";
import { useRouter } from "next/navigation";

interface Props {
  initialMessages: ChatMessage[];
  sessionId?: string;
}

export default function ChatContainer({ initialMessages, sessionId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(
    null,
  );

  const router = useRouter();

  async function handleSend(content: string) {
    if (isStreaming) return;

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage: ChatMessage = {
      id: tempId,
      role: "USER",
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      setIsStreaming(true);

      const assistantMessageId = `assistant-temp-${Date.now()}`;

      // insert assistant placeholder immediately
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

          await new Promise((r) => setTimeout(r, 10));
        }
      }

      if (!sessionId && returnedSessionId) {
        router.push(`/app/${returnedSessionId}`);
      }

      setIsStreaming(false);
      router.refresh();
    } catch {
      setIsStreaming(false);
    }
  }

  // REGENERATE


  async function handleRegenerate() {
    if (!sessionId || isStreaming) return;

    setIsStreaming(true);

    const assistantMessageId = `assistant-temp-${Date.now()}`;

    // remove last assistant 
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

        await new Promise((r) => setTimeout(r, 10));
      }
    }

    setIsStreaming(false);
    router.refresh();
  }

  // edit mode

  function handleEdit(message: ChatMessage) {
    if (isStreaming) return;
    setEditingMessage(message);
  }

  async function handleEditSubmit(newContent: string) {
    if (!editingMessage || !sessionId || isStreaming) return;

    setIsStreaming(true);

  
    const index = messages.findIndex((m) => m.id === editingMessage.id);
    const assistantMessageId = `assistant-temp-${Date.now()}`;

   
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

    const res = await fetch("/api/v1/chat/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        messageId: editingMessage.id,
        newContent,
      }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

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

        await new Promise((r) => setTimeout(r, 10));
      }
    }

    setEditingMessage(null);
    setIsStreaming(false);
    router.refresh();
  }


  return (
    <div className="flex flex-col h-full">
      <MessageList
        messages={messages}
        onRegenerate={handleRegenerate}
        onEdit={handleEdit}
        isStreaming={isStreaming}
      />

      <div className="mt-4">
        <MessageInput
          onSend={editingMessage ? handleEditSubmit : handleSend}
          isStreaming={isStreaming}
          initialValue={editingMessage?.content}
        />
      </div>
    </div>
  );
}
