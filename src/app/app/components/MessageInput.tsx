"use client";

import { useState } from "react";

interface Props {
  onSend: (content: string) => void;
}

export default function MessageInput({ onSend }: Props) {
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
        onClick={handleSend}
        className="px-4 py-2 bg-black text-white rounded"
      >
        Send
      </button>
    </div>
  );
}
