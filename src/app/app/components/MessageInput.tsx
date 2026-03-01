"use client";

import { useState } from "react";

interface Props {
  onSend: (content: string) => void;
  isStreaming: boolean;
}

export default function MessageInput({ onSend, isStreaming }: Props) {
  const [content, setContent] = useState("");

  function handleSend() {
    if (!content.trim()) return;

    onSend(content);
    setContent("");
  }

  return (
    <div className="border-t pt-4 flex gap-2">
      <input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start a conversation with Socratic..."
        autoFocus
        className="flex-1 border p-2 rounded "
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSend();
        }}
      />
      <button
        type="submit"
        disabled={isStreaming}
        className={`px-4 py-2 rounded ${
          isStreaming ? "bg-gray-400 cursor-not-allowed" : "bg-black text-white"
        }`}
      >
        Send
      </button>
    </div>
  );
}
