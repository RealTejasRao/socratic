"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, Copy, PenLine, RotateCcw, X } from "lucide-react";
import type { ChatMessage } from "src/types/chat";
import ThinkingBubble from "./ThinkingBubble";
import { cn } from "@/src/lib/utils";
import {
  buildChatAttachmentPreviewUrl,
  buildChatAttachmentThumbnailUrl,
} from "@/src/lib/cloudinary";

interface Props {
  messages: ChatMessage[];
  onRegenerate: () => void;
  onEdit: (message: ChatMessage) => void;
  onEditCancel: () => void;
  onEditSubmit: () => void;
  onEditDraftChange: (value: string) => void;
  isStreaming: boolean;
  userLabel: string;
  editingMessageId: string | null;
  editDraft: string;
}

const poppinsClassName = "[font-family:Poppins,sans-serif]";

export default function MessageList({
  messages,
  onRegenerate,
  onEdit,
  onEditCancel,
  onEditSubmit,
  onEditDraftChange,
  isStreaming,
  userLabel,
  editingMessageId,
  editDraft,
}: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{
    name: string;
    dataUrl: string;
  } | null>(null);

  async function handleCopy(messageId: string, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 1200);
    } catch {}
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!previewImage) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPreviewImage(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [previewImage]);

  useLayoutEffect(() => {
    const textarea = editTextareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [editDraft, editingMessageId]);

  const lastUserIndex = [...messages]
    .reverse()
    .findIndex((message) => message.role === "USER");

  const actualLastUserIndex =
    lastUserIndex === -1 ? -1 : messages.length - 1 - lastUserIndex;

  const lastAssistantIndex = [...messages]
    .reverse()
    .findIndex((message) => message.role === "ASSISTANT");

  const actualLastAssistantIndex =
    lastAssistantIndex === -1 ? -1 : messages.length - 1 - lastAssistantIndex;

  return (
    <div className="flex-1">
      <div className="mx-auto flex w-full max-w-[680px] flex-col gap-4.5 px-3 pb-10 pt-3 md:px-4">
        {messages.map((message, index) => {
          const isLastUser = index === actualLastUserIndex;
          const isLastAssistant = index === actualLastAssistantIndex;
          const isAssistant = message.role === "ASSISTANT";
          const isUser = message.role === "USER";
          const isEditingThisMessage = editingMessageId === message.id;

          return (
            <div
              key={message.id}
              className={cn(
                "group flex flex-col",
                isUser ? "items-end" : "items-start",
              )}
            >
              {isUser && (
                <div className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">
                  {userLabel}
                </div>
              )}

              {isEditingThisMessage ? (
                <div className="w-full max-w-[560px] rounded-[14px] border border-slate-300 bg-slate-200 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                  <textarea
                    ref={editTextareaRef}
                    value={editDraft}
                    onChange={(event) => onEditDraftChange(event.target.value)}
                    autoFocus
                    rows={1}
                    className={`${poppinsClassName} min-h-[32px] w-full resize-none overflow-hidden bg-transparent text-[13px] leading-6 text-slate-900 outline-none`}
                  />
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={onEditCancel}
                      disabled={isStreaming}
                      className="cursor-pointer rounded-[10px] border border-slate-300 bg-white px-3.5 py-1.5 text-[11px] text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={onEditSubmit}
                      disabled={isStreaming || !editDraft.trim()}
                      className="cursor-pointer rounded-[10px] bg-slate-900 px-3.5 py-1.5 text-[11px] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Send
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    "max-w-[560px] whitespace-pre-wrap px-3.5 py-3",
                    isUser
                      ? `${poppinsClassName} rounded-[10px] tracking-wider border border-slate-300 bg-slate-200 text-[13px] text-slate-900`
                      : "bg-transparent text-[13px] leading-[27px] tracking-[0.02em] text-slate-950 [font-family:Georgia,serif]",
                  )}
                >
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {message.attachments.map((attachment, attachmentIndex) => (
                        <button
                          key={`${attachment.name}-${attachmentIndex}`}
                          type="button"
                          onClick={() =>
                            setPreviewImage({
                              name: attachment.name,
                              dataUrl: attachment.dataUrl,
                            })
                          }
                          className="block overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300"
                          aria-label={`Open ${attachment.name} preview`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={buildChatAttachmentThumbnailUrl(
                              attachment.dataUrl,
                            )}
                            alt={attachment.name}
                            className="h-24 w-24 object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                  {isAssistant && !message.content ? (
                    <ThinkingBubble />
                  ) : (
                    message.content
                  )}
                </div>
              )}

              {!isEditingThisMessage && (
                <div
                  className={cn(
                    "mt-1 flex items-center gap-1 opacity-0 transition group-hover:opacity-100",
                    isUser ? "justify-end pr-0.5" : "justify-start pl-2",
                  )}
                >
                <button
                  onClick={() => handleCopy(message.id, message.content)}
                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-400 transition hover:border-slate-300 hover:bg-white hover:text-slate-700"
                  aria-label="Copy message"
                >
                  {copiedMessageId === message.id ? (
                    <Check size={12} />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>

                {isAssistant && isLastAssistant && (
                  <button
                    onClick={onRegenerate}
                    disabled={isStreaming}
                      className={cn(
                      "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white/90",
                      isStreaming
                        ? "cursor-not-allowed opacity-40"
                        : "text-slate-400 transition hover:border-slate-300 hover:bg-white hover:text-slate-700",
                    )}
                    aria-label="Regenerate response"
                  >
                    <RotateCcw size={12} />
                  </button>
                )}

                {isUser && isLastUser && (
                  <>
                    <button
                      onClick={() => onEdit(message)}
                      disabled={isStreaming}
                      className={cn(
                        "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white/90",
                        isStreaming
                          ? "cursor-not-allowed opacity-40"
                          : "text-slate-400 transition hover:border-slate-300 hover:bg-white hover:text-slate-700",
                      )}
                      aria-label="Edit message"
                    >
                      <PenLine size={12} />
                    </button>
                    <button
                      onClick={onRegenerate}
                      disabled={isStreaming}
                      className={cn(
                        "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white/90",
                        isStreaming
                          ? "cursor-not-allowed opacity-40"
                          : "text-slate-400 transition hover:border-slate-300 hover:bg-white hover:text-slate-700",
                      )}
                      aria-label="Regenerate response"
                    >
                      <RotateCcw size={12} />
                    </button>
                  </>
                )}
                </div>
              )}
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Preview of ${previewImage.name}`}
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20"
            onClick={() => setPreviewImage(null)}
            aria-label="Close image preview"
          >
            <X size={18} />
          </button>
          <div
            className="max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={buildChatAttachmentPreviewUrl(previewImage.dataUrl)}
              alt={previewImage.name}
              className="max-h-[90vh] max-w-[90vw] object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      )}
    </div>
  );
}
