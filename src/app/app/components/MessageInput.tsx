"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface Props {
  onSend: (content: string) => void;
  isStreaming: boolean;
  initialValue: string | undefined;
}

export default function MessageInput({
  onSend,
  isStreaming,
  initialValue,
}: Props) {
  const [content, setContent] = useState("");
  const pathname = usePathname();
  const storageKey = `socratic:draft:${pathname}`;

  // Restore unsent draft for this route/session.
  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved !== null) {
      setContent(saved);
    }
  }, [storageKey]);

  // keep user input so router.refresh do not lose it.
  useEffect(() => {
    if (content) {
      sessionStorage.setItem(storageKey, content);
    } else {
      sessionStorage.removeItem(storageKey);
    }
  }, [content, storageKey]);

  //  prefill input in edit mode
  useEffect(() => {
    if (initialValue !== undefined) {
      setContent(initialValue);
    }
  }, [initialValue]);

  function handleSend() {
    if (!content.trim() || isStreaming) return;

    onSend(content.trim());
    setContent(""); // clear after send or edit submit
    sessionStorage.removeItem(storageKey);
  }

  return (
    <div className="border-t pt-4 flex gap-2">
      <input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start a conversation with Socratic..."
        autoFocus
        className="flex-1 border p-2 rounded outline-none focus:ring-2 focus:ring-black"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSend();
          }
        }}
      />

      <button
        type="button"
        onClick={handleSend}
        disabled={isStreaming}
        className={`px-4 py-2 rounded transition ${
          isStreaming
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-black text-white hover:bg-black/80"
        }`}
      >
        Send
      </button>
    </div>
  );
}
