"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Compass, Link2, Mic, SendHorizontal, X } from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { ChatImageAttachment } from "src/types/chat";

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function subscribeToClientSnapshot() {
  return () => {};
}

interface Props {
  onSend: (payload: {
    content: string;
    attachments: ChatImageAttachment[];
    webSearch: boolean;
  }) => void;
  isStreaming: boolean;
  initialValue: string | undefined;
  variant?: "default" | "hero";
  placeholder?: string;
}

const MAX_ATTACHMENTS = 3;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function MessageInput({
  onSend,
  isStreaming,
  initialValue,
  variant = "default",
  placeholder = "What's on your mind?",
}: Props) {
  const pathname = usePathname();
  const storageKey = `socratic:draft:${pathname}`;
  const draftContent = useSyncExternalStore(
    subscribeToClientSnapshot,
    () => {
      if (initialValue !== undefined) {
        return initialValue;
      }

      return sessionStorage.getItem(storageKey) ?? "";
    },
    () => initialValue ?? "",
  );
  const [contentOverride, setContentOverride] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<ChatImageAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceBaseContentRef = useRef("");
  const isStoppingRecognitionRef = useRef(false);
  const supportsWebSpeech = useSyncExternalStore(
    subscribeToClientSnapshot,
    () => {
      const speechWindow = window as Window & {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      };

      return Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition);
    },
    () => null,
  );
  const content = contentOverride ?? draftContent;

  useEffect(() => {
    if (initialValue !== undefined) {
      return;
    }

    if (content) {
      sessionStorage.setItem(storageKey, content);
    } else {
      sessionStorage.removeItem(storageKey);
    }
  }, [content, initialValue, storageKey]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [content]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  function mergeVoiceTranscript(baseContent: string, transcript: string) {
    const normalizedBase = baseContent.trimEnd();
    const normalizedTranscript = transcript.trim();

    if (!normalizedTranscript) {
      return normalizedBase;
    }

    const merged = normalizedBase
      ? `${normalizedBase}${/\s$/.test(normalizedBase) ? "" : " "}${normalizedTranscript}`
      : normalizedTranscript;

    return merged.slice(0, 3000);
  }

  function getRecognition() {
    if (recognitionRef.current) {
      return recognitionRef.current;
    }

    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const RecognitionConstructor =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!RecognitionConstructor) {
      return null;
    }

    const recognition = new RecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";
    recognition.onresult = (event) => {
      let transcript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        transcript += result[0]?.transcript ?? "";
      }

      setContentOverride(mergeVoiceTranscript(voiceBaseContentRef.current, transcript));
      setVoiceError("");
    };
    recognition.onerror = (event) => {
      const nextError =
        event.error === "not-allowed"
          ? "Microphone permission was denied."
          : event.error === "no-speech"
            ? "I couldn't hear anything. Try again."
            : "Voice dictation ran into a problem.";

      setVoiceError(nextError);
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      isStoppingRecognitionRef.current = false;
    };

    recognitionRef.current = recognition;
    return recognition;
  }

  function handleVoiceToggle() {
    if (!supportsWebSpeech || isStreaming) {
      return;
    }

    const recognition = getRecognition();

    if (!recognition) {
      setVoiceError("Sorry, this feature is not supported by your browser :(");
      return;
    }

    if (isListening) {
      isStoppingRecognitionRef.current = true;
      recognition.stop();
      return;
    }

    try {
      voiceBaseContentRef.current = content;
      setVoiceError("");
      recognition.start();
      setIsListening(true);
      textareaRef.current?.focus();
    } catch {
      setIsListening(false);
      setVoiceError("Voice dictation could not start.");
    }
  }

  function handleSend() {
    if ((!content.trim() && attachments.length === 0) || isStreaming) return;
    if (isListening) {
      recognitionRef.current?.stop();
    }
    onSend({
      content: content.trim(),
      attachments,
      webSearch: webSearchEnabled,
    });
    setContentOverride("");
    setAttachments([]);
    setAttachmentError("");
    setVoiceError("");
    setWebSearchEnabled(false);
    sessionStorage.removeItem(storageKey);
  }

  async function handleFilesSelected(files: FileList | null) {
    if (!files?.length) return;

    const selectedFiles = Array.from(files).slice(0, MAX_ATTACHMENTS - attachments.length);
    const nextAttachments: ChatImageAttachment[] = [];

    for (const file of selectedFiles) {
      if (!file.type.startsWith("image/")) {
        setAttachmentError("Only image files are supported.");
        continue;
      }

      if (file.size > MAX_IMAGE_BYTES) {
        setAttachmentError("Each image must be under 5 MB.");
        continue;
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () => reject(new Error("Failed to read image."));
        reader.readAsDataURL(file);
      }).catch(() => "");

      if (!dataUrl) {
        setAttachmentError("One of the images could not be read.");
        continue;
      }

      nextAttachments.push({
        type: "image",
        dataUrl,
        mimeType: file.type,
        name: file.name,
      });
    }

    if (nextAttachments.length > 0) {
      setAttachments((current) => [...current, ...nextAttachments].slice(0, MAX_ATTACHMENTS));
      setAttachmentError("");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className={cn("mx-auto w-full", variant === "hero" ? "max-w-3xl" : "max-w-2xl")}>
      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-slate-200 px-4 py-3">
            {attachments.map((attachment, index) => (
              <div
                key={`${attachment.name}-${index}`}
                className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={attachment.dataUrl}
                  alt={attachment.name}
                  className="h-16 w-16 object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setAttachments((current) => current.filter((_, currentIndex) => currentIndex !== index))
                  }
                  className="absolute top-1 right-1 rounded-full bg-white/90 p-1 text-slate-500 shadow-sm transition hover:text-slate-900"
                  aria-label={`Remove ${attachment.name}`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => setContentOverride(event.target.value)}
          placeholder={placeholder}
          maxLength={3000}
          rows={1}
          className="min-h-0 w-full resize-none px-4 pt-3 pb-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
        />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => void handleFilesSelected(event.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-slate-100"
            >
              <Link2 size={13} /> Attach
            </button>
            {supportsWebSpeech === false ? (
              <div className="group relative">
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="relative inline-flex cursor-not-allowed items-center gap-1 rounded-lg px-2 py-1 text-slate-400"
                >
                  <Mic size={13} /> Voice
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-1/2 h-5 w-px -translate-x-1/2 -translate-y-1/2 rotate-[-36deg] bg-red-500"
                  />
                </button>

                <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-56 -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-[11px] leading-4 text-white shadow-[0_12px_30px_rgba(15,23,42,0.22)] group-hover:block group-focus-within:block">
                  Sorry, this feature is not supported by your browser :(
                  <div
                    aria-hidden="true"
                    className="absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-slate-900"
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleVoiceToggle}
                disabled={isStreaming}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-slate-100"
              >
                <Mic size={13} className={cn(isListening && "text-sky-600")} />{" "}
                {isListening ? "Listening..." : "Voice"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setWebSearchEnabled((current) => !current)}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg px-2 py-1 transition",
                webSearchEnabled
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "hover:bg-slate-100",
              )}
              aria-pressed={webSearchEnabled}
            >
              <Compass size={13} /> Web search
            </button>
          </div>

          <div className="flex items-center gap-2">
            {content.length >= 3000 && (
              <span className="text-xs text-amber-700">Max limit reached</span>
            )}
            {attachmentError && content.length < 3000 && (
              <span className="text-xs text-amber-700">{attachmentError}</span>
            )}
            {voiceError && !attachmentError && content.length < 3000 && (
              <span className="text-xs text-amber-700">{voiceError}</span>
            )}
            <button
              type="button"
              onClick={handleSend}
              disabled={isStreaming || (!content.trim() && attachments.length === 0)}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-700",
                isStreaming || (!content.trim() && attachments.length === 0)
                  ? "cursor-not-allowed opacity-45"
                  : "hover:bg-slate-100",
              )}
              aria-label="Send"
            >
              <SendHorizontal size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
