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
    const sendStartedAtMs = performance.now();

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
      const headersReceivedAtMs = performance.now();
      const serverPrepareMs = res.headers.get("X-Server-Prepare-Ms");
      const aiContextMs = res.headers.get("X-AI-Context-Ms");
      const aiRetrievalMs = res.headers.get("X-AI-Retrieval-Ms");
      const aiPrestreamMs = res.headers.get("X-AI-Prestream-Ms");
      const aiStreamSetupMs = res.headers.get("X-AI-Stream-Setup-Ms");

      const returnedSessionId = res.headers.get("X-Session-Id");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      let assistantContent = "";
      let firstChunkAtMs: number | null = null;

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        if (firstChunkAtMs === null) {
          firstChunkAtMs = performance.now();
        }

        const chunk = decoder.decode(value);
        assistantContent += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: assistantContent }
              : msg,
          ),
        );
      }

      if (process.env.NODE_ENV === "development") {
        const doneAtMs = performance.now();
        console.log("CHAT_TIMING", {
          totalMs: Math.round(doneAtMs - sendStartedAtMs),
          toHeadersMs: Math.round(headersReceivedAtMs - sendStartedAtMs),
          toFirstChunkMs:
            firstChunkAtMs === null
              ? null
              : Math.round(firstChunkAtMs - sendStartedAtMs),
          serverPrepareMs: serverPrepareMs ? Number.parseInt(serverPrepareMs, 10) : null,
          aiContextMs: aiContextMs ? Number.parseInt(aiContextMs, 10) : null,
          aiRetrievalMs: aiRetrievalMs ? Number.parseInt(aiRetrievalMs, 10) : null,
          aiPrestreamMs: aiPrestreamMs ? Number.parseInt(aiPrestreamMs, 10) : null,
          aiStreamSetupMs: aiStreamSetupMs
            ? Number.parseInt(aiStreamSetupMs, 10)
            : null,
        });
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
      assistantContent += chunk;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: assistantContent }
            : msg,
        ),
      );
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

    let messageIdForEdit = editingMessage.id;


    if (messageIdForEdit.startsWith("temp-")) {
      const lookupRes = await fetch(`/api/v1/chat/sessions/${sessionId}/messages`);
      if (lookupRes.ok) {
        const persistedMessages = (await lookupRes.json()) as ChatMessage[];
        const latestUserMessage = [...persistedMessages]
          .reverse()
          .find((m) => m.role === "USER");

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

    let assistantContent = "";

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      const chunk = decoder.decode(value);
      assistantContent += chunk;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: assistantContent }
            : msg,
        ),
      );
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
