"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import {
  Check,
  Copy,
  Pause,
  PenLine,
  Play,
  RotateCcw,
  Square,
  Volume2,
} from "lucide-react";
import type { ChatMessage } from "src/types/chat";
import ThinkingBubble from "./ThinkingBubble";
import { cn } from "@/src/lib/utils";
import { buildChatAttachmentThumbnailUrl } from "@/src/lib/cloudinary";
import { isChatFontSize, type ChatFontSize } from "src/lib/chat-display";
import ImagePreviewDialog from "./ImagePreviewDialog";

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
  disableRevisionActions?: boolean;
  topContent?: ReactNode;
}

const poppinsClassName = "[font-family:Poppins,sans-serif]";
const URL_PATTERN = /(https?:\/\/[^\s]+)/gi;
const EMPHASIS_PATTERN = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g;
const CHAT_FONT_SIZE_KEY = "socratic:chat:fontSize";

function renderInlineFormatting(text: string, keyPrefix: string) {
  const parts = text.split(EMPHASIS_PATTERN);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={`${keyPrefix}-b-${index}`}>{part.slice(2, -2)}</strong>
      );
    }

    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={`${keyPrefix}-i-${index}`}>{part.slice(1, -1)}</em>;
    }

    return <span key={`${keyPrefix}-t-${index}`}>{part}</span>;
  });
}

function renderMessageContentWithLinks(content: string) {
  if (!content) {
    return content;
  }

  const parts = content.split(URL_PATTERN);

  return parts.map((part, index) => {
    if (part.match(URL_PATTERN)) {
      return (
        <a
          key={`${part}-${index}`}
          href={part}
          target="_blank"
          rel="noreferrer noopener"
          className="text-sky-700 underline underline-offset-2 transition hover:text-sky-900"
        >
          {part}
        </a>
      );
    }

    return (
      <span key={`${part}-${index}`}>
        {renderInlineFormatting(part, `msg-${index}`)}
      </span>
    );
  });
}

function pickPreferredVoice(voices: SpeechSynthesisVoice[]) {
  if (!voices.length) {
    return null;
  }

  const englishVoices = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith("en"),
  );
  const pool = englishVoices.length ? englishVoices : voices;

  const britishFemalePriorityNames = [
    "google uk english female",
    "libby",
    "hazel",
    "susan",
    "serena",
    "kate",
    "sophie",
  ];

  for (const keyword of britishFemalePriorityNames) {
    const exactBritishFemale = pool.find((voice) => {
      const name = voice.name.toLowerCase();
      const lang = voice.lang.toLowerCase();
      return lang.startsWith("en-gb") && name.includes(keyword);
    });

    if (exactBritishFemale) {
      return exactBritishFemale;
    }
  }

  const britishFemaleByLang = pool.find((voice) => {
    const name = voice.name.toLowerCase();
    const lang = voice.lang.toLowerCase();
    return (
      lang.startsWith("en-gb") &&
      (name.includes("female") || name.includes("woman"))
    );
  });

  if (britishFemaleByLang) {
    return britishFemaleByLang;
  }

  const britishAny = pool.find((voice) =>
    voice.lang.toLowerCase().startsWith("en-gb"),
  );

  if (britishAny) {
    return britishAny;
  }

  const previousFallbackNames = [
    "aria",
    "jenny",
    "samantha",
    "zira",
    "google us english",
  ];

  for (const keyword of previousFallbackNames) {
    const match = pool.find((voice) =>
      voice.name.toLowerCase().includes(keyword),
    );

    if (match) {
      return match;
    }
  }

  return pool[0] ?? null;
}

function readChatFontSizeSetting(): ChatFontSize {
  if (typeof window === "undefined") {
    return "MEDIUM";
  }

  try {
    const value = localStorage.getItem(CHAT_FONT_SIZE_KEY);
    return isChatFontSize(value) ? value : "MEDIUM";
  } catch {
    return "MEDIUM";
  }
}

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
  disableRevisionActions = false,
  topContent,
}: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const editTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{
    name: string;
    dataUrl: string;
  } | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null,
  );
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);
  const [chatFontSize, setChatFontSize] = useState<ChatFontSize>("MEDIUM");
  const [streamingChunkMessageId, setStreamingChunkMessageId] = useState<
    string | null
  >(null);
  const [streamingChunks, setStreamingChunks] = useState<
    Array<{ id: number; text: string }>
  >([]);
  const streamingChunkCounterRef = useRef(0);
  const previousStreamingMessageIdRef = useRef<string | null>(null);
  const previousStreamingContentRef = useRef("");

  async function handleCopy(messageId: string, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 1200);
    } catch {}
  }

  const resetSpeechState = useCallback(() => {
    activeUtteranceRef.current = null;
    setSpeakingMessageId(null);
    setIsSpeechPaused(false);
  }, []);

  const stopSpeech = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    resetSpeechState();
  }, [resetSpeechState]);

  function speakMessage(messageId: string, content: string) {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      typeof SpeechSynthesisUtterance === "undefined"
    ) {
      return;
    }

    const cleanedContent = content.trim();
    if (!cleanedContent) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanedContent);
    const selectedVoice = selectedVoiceURI
      ? (availableVoices.find((voice) => voice.voiceURI === selectedVoiceURI) ??
        null)
      : pickPreferredVoice(availableVoices);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    }

    utterance.onstart = () => {
      setSpeakingMessageId(messageId);
      setIsSpeechPaused(false);
    };

    utterance.onpause = () => {
      setIsSpeechPaused(true);
    };

    utterance.onresume = () => {
      setIsSpeechPaused(false);
    };

    utterance.onend = () => {
      setSpeakingMessageId((current) => {
        if (current === messageId) {
          activeUtteranceRef.current = null;
          return null;
        }

        return current;
      });
      setIsSpeechPaused(false);
    };

    utterance.onerror = () => {
      setSpeakingMessageId((current) => {
        if (current === messageId) {
          activeUtteranceRef.current = null;
          return null;
        }

        return current;
      });
      setIsSpeechPaused(false);
    };

    activeUtteranceRef.current = utterance;
    setSpeakingMessageId(messageId);
    setIsSpeechPaused(false);
    window.speechSynthesis.speak(utterance);
  }

  function togglePauseSpeech() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    if (!speakingMessageId) {
      return;
    }

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsSpeechPaused(false);
      return;
    }

    window.speechSynthesis.pause();
    setIsSpeechPaused(true);
  }

  useEffect(() => {
    const bottomEl = bottomRef.current;
    if (!bottomEl) {
      return;
    }

    const scrollContainer = bottomEl.closest(
      ".app-chat-main",
    ) as HTMLElement | null;
    if (!scrollContainer) {
      return;
    }
    scrollContainerRef.current = scrollContainer;

    const updateAutoScrollState = () => {
      const distanceFromBottom =
        scrollContainer.scrollHeight -
        scrollContainer.scrollTop -
        scrollContainer.clientHeight;
      shouldAutoScrollRef.current = distanceFromBottom <= 96;
    };

    updateAutoScrollState();
    scrollContainer.addEventListener("scroll", updateAutoScrollState, {
      passive: true,
    });

    return () => {
      scrollContainer.removeEventListener("scroll", updateAutoScrollState);
      scrollContainerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) {
      return;
    }

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      bottomRef.current?.scrollIntoView({
        behavior: isStreaming ? "auto" : "smooth",
        block: "end",
      });
      return;
    }

    if (isStreaming) {
      const previousScrollBehavior = scrollContainer.style.scrollBehavior;
      scrollContainer.style.scrollBehavior = "auto";
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
      scrollContainer.style.scrollBehavior = previousScrollBehavior;
      return;
    }

    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isStreaming, messages]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const synth = window.speechSynthesis;

    const syncVoices = () => {
      const voices = synth.getVoices();
      setAvailableVoices(voices);

      setSelectedVoiceURI((current) => {
        if (current && voices.some((voice) => voice.voiceURI === current)) {
          return current;
        }

        return pickPreferredVoice(voices)?.voiceURI ?? null;
      });
    };

    syncVoices();
    synth.addEventListener("voiceschanged", syncVoices);

    return () => {
      synth.removeEventListener("voiceschanged", syncVoices);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!speakingMessageId) {
      return;
    }

    const hasSpeakingMessage = messages.some(
      (message) => message.id === speakingMessageId,
    );

    if (!hasSpeakingMessage) {
      const timeoutId = window.setTimeout(() => {
        stopSpeech();
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }
  }, [messages, speakingMessageId, stopSpeech]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setChatFontSize(readChatFontSizeSetting());
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    function handleFontSizeChanged(event: Event) {
      const customEvent = event as CustomEvent<{ size?: ChatFontSize }>;
      const size = customEvent.detail?.size;

      if (!isChatFontSize(size)) {
        return;
      }

      setChatFontSize(size);
    }

    window.addEventListener(
      "socratic:chat-font-size:changed",
      handleFontSizeChanged,
    );

    return () => {
      window.removeEventListener(
        "socratic:chat-font-size:changed",
        handleFontSizeChanged,
      );
    };
  }, []);

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

  useEffect(() => {
    const lastAssistantMessage = [...messages]
      .reverse()
      .find((message) => message.role === "ASSISTANT");

    if (!isStreaming || !lastAssistantMessage) {
      setStreamingChunkMessageId(null);
      setStreamingChunks([]);
      streamingChunkCounterRef.current = 0;
      previousStreamingMessageIdRef.current = null;
      previousStreamingContentRef.current = "";
      return;
    }

    const currentMessageId = lastAssistantMessage.id;
    const currentContent = lastAssistantMessage.content ?? "";
    const previousMessageId = previousStreamingMessageIdRef.current;
    const previousContent = previousStreamingContentRef.current;
    const isNewStreamingMessage = previousMessageId !== currentMessageId;
    const canDiffFromPrevious =
      !isNewStreamingMessage && currentContent.startsWith(previousContent);
    const chunkText = canDiffFromPrevious
      ? currentContent.slice(previousContent.length)
      : currentContent;

    if (isNewStreamingMessage || !canDiffFromPrevious) {
      streamingChunkCounterRef.current = 0;
    }

    setStreamingChunkMessageId(currentMessageId);
    setStreamingChunks((previousChunks) => {
      const baseChunks =
        isNewStreamingMessage || !canDiffFromPrevious ? [] : previousChunks;

      if (!chunkText) {
        return baseChunks;
      }

      const chunkId = streamingChunkCounterRef.current;
      streamingChunkCounterRef.current += 1;

      return [...baseChunks, { id: chunkId, text: chunkText }];
    });

    previousStreamingMessageIdRef.current = currentMessageId;
    previousStreamingContentRef.current = currentContent;
  }, [isStreaming, messages]);

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
  const userTextClass =
    chatFontSize === "SMALL"
      ? "text-[13px] leading-6"
      : chatFontSize === "LARGE"
        ? "text-[17px] leading-7"
        : "text-[15px] leading-6.5";
  const assistantTextClass =
    chatFontSize === "SMALL"
      ? "text-[14px] leading-[1.8]"
      : chatFontSize === "LARGE"
        ? "text-[18px] leading-[1.78]"
        : "text-[16px] leading-[1.78]";
  const editTextClass =
    chatFontSize === "SMALL"
      ? "text-[13px] leading-6"
      : chatFontSize === "LARGE"
        ? "text-[17px] leading-7"
        : "text-[15px] leading-6.5";

  return (
    <div className="flex-1">
      <div className="mx-auto flex w-full max-w-175 flex-col gap-1 px-3 pb-10 pt-3 md:px-4">
        {topContent}
        {messages.map((message, index) => {
          const isLastUser = index === actualLastUserIndex;
          const isLastAssistant = index === actualLastAssistantIndex;
          const isAssistant = message.role === "ASSISTANT";
          const isUser = message.role === "USER";
          const isEditingThisMessage = editingMessageId === message.id;
          const isSpeakingThisMessage = speakingMessageId === message.id;
          const showAssistantSeparator =
            isAssistant && index < messages.length - 1;

          return (
            <div
              key={message.id}
              className={cn(
                "group flex w-full flex-col",
                isUser ? "items-end" : "items-start",
              )}
            >
              {isUser && (
                <div className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">
                  {userLabel}
                </div>
              )}

              {isEditingThisMessage ? (
                <div className="app-user-edit-shell w-full max-w-140 rounded-[14px] border border-slate-300 bg-[#f4f4f4] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                  <textarea
                    ref={editTextareaRef}
                    value={editDraft}
                    onChange={(event) => onEditDraftChange(event.target.value)}
                    autoFocus
                    rows={1}
                    className={`${poppinsClassName} app-user-edit-textarea ${editTextClass} min-h-8 w-full resize-none overflow-hidden bg-transparent text-slate-900 outline-none`}
                  />
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={onEditCancel}
                      disabled={isStreaming}
                      className="app-user-edit-cancel cursor-pointer rounded-[10px] border border-slate-300 bg-white px-3.5 py-1.5 text-[11px] text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={onEditSubmit}
                      disabled={isStreaming || !editDraft.trim()}
                      className="app-user-edit-send cursor-pointer rounded-[10px] bg-slate-900 px-3.5 py-1.5 text-[11px] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Send
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    "whitespace-pre-wrap px-3 py-2",
                    isUser
                      ? `max-w-140 ${poppinsClassName} ${userTextClass} app-user-bubble rounded-[9px] tracking-wider border border-slate-300 bg-[#f4f4f4] text-slate-900`
                      : `w-full max-w-[68ch] app-assistant-text ${assistantTextClass} bg-transparent tracking-[0.01em] text-slate-950 font-[Georgia,serif]`,
                  )}
                >
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {message.attachments.map(
                        (attachment, attachmentIndex) => (
                          <button
                            key={`${attachment.name}-${attachmentIndex}`}
                            type="button"
                            onClick={() =>
                              setPreviewImage({
                                name: attachment.name,
                                dataUrl: attachment.dataUrl,
                              })
                            }
                            className="block cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300"
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
                        ),
                      )}
                    </div>
                  )}
                  {isAssistant &&
                  isStreaming &&
                  isLastAssistant &&
                  !message.content.trim() ? (
                    <ThinkingBubble />
                  ) : isAssistant && isStreaming && isLastAssistant ? (
                    streamingChunkMessageId === message.id &&
                    streamingChunks.length > 0 ? (
                      streamingChunks.map((chunk) => (
                        <motion.span
                          key={`${message.id}-chunk-${chunk.id}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            duration: 3,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          {renderMessageContentWithLinks(chunk.text)}
                        </motion.span>
                      ))
                    ) : (
                      renderMessageContentWithLinks(message.content)
                    )
                  ) : (
                    renderMessageContentWithLinks(message.content)
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
                    className="msg-action-btn inline-flex h-8 w-8 cursor-pointer items-center justify-center text-slate-400 transition hover:text-slate-700"
                    aria-label="Copy message"
                    data-tooltip="Copy message"
                  >
                    {copiedMessageId === message.id ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>

                  {isAssistant && message.content.trim() && (
                    <>
                      {!isSpeakingThisMessage ? (
                        <button
                          onClick={() =>
                            speakMessage(message.id, message.content)
                          }
                          className="msg-action-btn inline-flex h-8 w-8 cursor-pointer items-center justify-center text-slate-400 transition hover:text-slate-700"
                          aria-label="Speak response"
                          data-tooltip="Speak response"
                        >
                          <Volume2 size={14} />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={togglePauseSpeech}
                            className="msg-action-btn inline-flex h-8 w-8 cursor-pointer items-center justify-center text-slate-400 transition hover:text-slate-700"
                            aria-label={
                              isSpeechPaused ? "Resume speech" : "Pause speech"
                            }
                            data-tooltip={
                              isSpeechPaused ? "Resume speech" : "Pause speech"
                            }
                          >
                            {isSpeechPaused ? (
                              <Play size={14} />
                            ) : (
                              <Pause size={14} />
                            )}
                          </button>
                          <button
                            onClick={stopSpeech}
                            className="msg-action-btn inline-flex h-8 w-8 cursor-pointer items-center justify-center text-slate-400 transition hover:text-slate-700"
                            aria-label="Stop speech"
                            data-tooltip="Stop speech"
                          >
                            <Square size={13} />
                          </button>
                        </>
                      )}
                    </>
                  )}

                  {isAssistant &&
                    isLastAssistant &&
                    !disableRevisionActions && (
                      <button
                        onClick={onRegenerate}
                        disabled={isStreaming}
                        className={cn(
                          "msg-action-btn inline-flex h-8 w-8 cursor-pointer items-center justify-center",
                          isStreaming
                            ? "cursor-not-allowed opacity-40"
                            : "text-slate-400 transition hover:text-slate-700",
                        )}
                        aria-label="Regenerate response"
                        data-tooltip="Regenerate response"
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}

                  {isUser && isLastUser && !disableRevisionActions && (
                    <>
                      <button
                        onClick={() => onEdit(message)}
                        disabled={isStreaming}
                        className={cn(
                          "msg-action-btn inline-flex h-8 w-8 cursor-pointer items-center justify-center",
                          isStreaming
                            ? "cursor-not-allowed opacity-40"
                            : "text-slate-400 transition hover:text-slate-700",
                        )}
                        aria-label="Edit message"
                        data-tooltip="Edit message"
                      >
                        <PenLine size={14} />
                      </button>
                      <button
                        onClick={onRegenerate}
                        disabled={isStreaming}
                        className={cn(
                          "msg-action-btn inline-flex h-8 w-8 cursor-pointer items-center justify-center",
                          isStreaming
                            ? "cursor-not-allowed opacity-40"
                            : "text-slate-400 transition hover:text-slate-700",
                        )}
                        aria-label="Regenerate response"
                        data-tooltip="Regenerate response"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </>
                  )}
                </div>
              )}

              {showAssistantSeparator && (
                <div
                  aria-hidden="true"
                  className="mt-4 mb-2 w-full border-t border-slate-300/80"
                />
              )}
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {previewImage && (
        <ImagePreviewDialog
          image={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
}
