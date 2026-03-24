"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp, CornerDownLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { cn } from "@/src/lib/utils";

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
  const pathname = usePathname();
  const storageKey = `socratic:draft:${pathname}`;
  const [content, setContent] = useState(() => {
    if (initialValue !== undefined) {
      return initialValue;
    }

    if (typeof window === "undefined") {
      return "";
    }

    return sessionStorage.getItem(storageKey) ?? "";
  });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (content) {
      sessionStorage.setItem(storageKey, content);
    } else {
      sessionStorage.removeItem(storageKey);
    }
  }, [content, storageKey]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
  }, [content]);

  function handleSend() {
    if (!content.trim() || isStreaming) return;

    onSend(content.trim());
    setContent("");
    sessionStorage.removeItem(storageKey);
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="rounded-[30px] border border-border/70 bg-background/80 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Ask a sharper question, test an assumption, or continue the thread..."
          autoFocus
          rows={1}
          className="min-h-0 resize-none border-0 bg-transparent px-2 py-2 text-base shadow-none focus-visible:ring-0"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
        />

        <div className="mt-3 flex flex-col gap-3 border-t border-border/60 px-1 pt-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CornerDownLeft size={14} />
            <span>Enter sends</span>
            <span className="text-border">/</span>
            <span>Shift + Enter adds a new line</span>
          </div>

          <Button
            type="button"
            onClick={handleSend}
            disabled={isStreaming || !content.trim()}
            className={cn("h-11 rounded-2xl px-5", !content.trim() && "shadow-none")}
          >
            <span>{isStreaming ? "Thinking..." : "Send message"}</span>
            <ArrowUp size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
