"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp, Globe, Mic, Paperclip, Plus, X } from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { ChatImageAttachment } from "src/types/chat";

const poppinsClassName = "[font-family:Poppins,sans-serif]";

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
  showWebSearch?: boolean;
}

interface ComposerImageAttachment {
  id: string;
  previewUrl: string;
  name: string;
  status: "uploading" | "ready" | "error";
  attachment?: ChatImageAttachment;
}

interface SignedUploadPayload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

const MAX_ATTACHMENTS = 3;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function MessageInput({
  onSend,
  isStreaming,
  initialValue,
  variant = "default",
  placeholder = "What's on your mind?",
  showWebSearch = true,
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
  const [composerAttachments, setComposerAttachments] = useState<
    ComposerImageAttachment[]
  >([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const attachmentsRef = useRef<ComposerImageAttachment[]>([]);
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

      return Boolean(
        speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition,
      );
    },
    () => null,
  );
  const content = contentOverride ?? draftContent;
  const attachments = composerAttachments
    .filter((item) => item.status === "ready" && item.attachment)
    .map((item) => item.attachment as ChatImageAttachment);
  const isUploadingAttachments = composerAttachments.some(
    (item) => item.status === "uploading",
  );

  useEffect(() => {
    attachmentsRef.current = composerAttachments;
  }, [composerAttachments]);

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

      for (const attachment of attachmentsRef.current) {
        if (attachment.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      }
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!actionMenuRef.current?.contains(event.target as Node)) {
        setIsActionMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
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

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];
        if (!result) {
          continue;
        }
        transcript += result[0]?.transcript ?? "";
      }

      setContentOverride(
        mergeVoiceTranscript(voiceBaseContentRef.current, transcript),
      );
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
    if (
      (!content.trim() && attachments.length === 0) ||
      isStreaming ||
      isUploadingAttachments
    ) {
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
    }
    onSend({
      content: content.trim(),
      attachments,
      webSearch: webSearchEnabled,
    });
    setContentOverride("");
    for (const attachment of composerAttachments) {
      if (attachment.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    }
    setComposerAttachments([]);
    setAttachmentError("");
    setVoiceError("");
    setWebSearchEnabled(false);
    sessionStorage.removeItem(storageKey);
  }

  function removeAttachmentById(attachmentId: string) {
    setComposerAttachments((current) => {
      const target = current.find((item) => item.id === attachmentId);

      if (target?.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((item) => item.id !== attachmentId);
    });
  }

  async function uploadImageToCloudinary(file: File) {
    const signRes = await fetch("/api/v1/uploads/images/sign", {
      method: "POST",
    });

    if (!signRes.ok) {
      throw new Error("Could not initialize image upload.");
    }

    const signPayload = (await signRes.json()) as SignedUploadPayload;
    const formData = new FormData();

    formData.append("file", file);
    formData.append("api_key", signPayload.apiKey);
    formData.append("timestamp", String(signPayload.timestamp));
    formData.append("signature", signPayload.signature);
    formData.append("folder", signPayload.folder);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${signPayload.cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!uploadRes.ok) {
      throw new Error("Image upload failed.");
    }

    const uploaded = (await uploadRes.json()) as {
      secure_url?: string;
      public_id?: string;
      bytes?: number;
      width?: number;
      height?: number;
    };

    if (!uploaded.secure_url) {
      throw new Error("Image upload did not return a valid URL.");
    }

    const attachment: ChatImageAttachment = {
      type: "image" as const,
      dataUrl: uploaded.secure_url,
      mimeType: file.type,
      name: file.name,
    };

    if (uploaded.public_id !== undefined) {
      attachment.publicId = uploaded.public_id;
    }

    if (uploaded.bytes !== undefined) {
      attachment.bytes = uploaded.bytes;
    }

    if (uploaded.width !== undefined) {
      attachment.width = uploaded.width;
    }

    if (uploaded.height !== undefined) {
      attachment.height = uploaded.height;
    }

    return attachment;
  }

  async function handleFilesSelected(files: FileList | null) {
    if (!files?.length) return;

    const availableSlots = Math.max(
      0,
      MAX_ATTACHMENTS - composerAttachments.length,
    );

    if (availableSlots === 0) {
      setAttachmentError(`You can attach up to ${MAX_ATTACHMENTS} images.`);
      return;
    }

    const selectedFiles = Array.from(files).slice(0, availableSlots);

    if (files.length > availableSlots) {
      setAttachmentError(`You can attach up to ${MAX_ATTACHMENTS} images.`);
    } else {
      setAttachmentError("");
    }

    for (const file of selectedFiles) {
      if (!file.type.startsWith("image/")) {
        setAttachmentError("Only image files are supported.");
        continue;
      }

      if (file.size > MAX_IMAGE_BYTES) {
        setAttachmentError("Each image must be under 5 MB.");
        continue;
      }

      const attachmentId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const previewUrl = URL.createObjectURL(file);

      setComposerAttachments((current) => [
        ...current,
        {
          id: attachmentId,
          previewUrl,
          name: file.name,
          status: "uploading",
        },
      ]);

      try {
        const uploadedAttachment = await uploadImageToCloudinary(file);

        setComposerAttachments((current) =>
          current.map((attachment) =>
            attachment.id === attachmentId
              ? {
                  ...attachment,
                  status: "ready",
                  attachment: uploadedAttachment,
                }
              : attachment,
          ),
        );
      } catch {
        setComposerAttachments((current) =>
          current.map((attachment) =>
            attachment.id === attachmentId
              ? {
                  ...attachment,
                  status: "error",
                }
              : attachment,
          ),
        );
        setAttachmentError("One or more images failed to upload.");
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div
      className={cn(
        "mx-auto w-full",
        variant === "hero" ? "max-w-[500px]" : "max-w-[620px]",
      )}
    >
      <div className="app-input-shell overflow-visible rounded-[12px] border border-transparent bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12),0_8px_24px_rgba(15,23,42,0.045)]">
        {composerAttachments.length > 0 && (
          <div className="app-input-attachments flex flex-wrap gap-2 px-3.5 py-2.5">
            {composerAttachments.map((attachment) => (
              <div
                key={attachment.id}
                className="app-card relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={attachment.previewUrl}
                  alt={attachment.name}
                  className="h-12 w-12 object-cover"
                />
                {attachment.status === "uploading" && (
                  <div className="absolute inset-0 grid place-items-center bg-white/70 text-[10px] font-medium text-slate-700">
                    Uploading...
                  </div>
                )}
                {attachment.status === "error" && (
                  <div className="absolute inset-0 grid place-items-center bg-rose-50/90 text-[10px] font-medium text-rose-700">
                    Failed
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeAttachmentById(attachment.id)}
                  className="absolute top-1 right-1 cursor-pointer rounded-[8px] bg-white/90 p-1 text-slate-500 shadow-sm transition hover:text-slate-900"
                  aria-label={`Remove ${attachment.name}`}
                  data-tooltip={`Remove ${attachment.name}`}
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
          className={`${poppinsClassName} app-input-textarea block min-h-[44px] w-full resize-none px-3.5 pt-2.5 pb-1.5 text-[12px] leading-5 text-slate-900 outline-none placeholder:text-slate-400`}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
        />

        <div className="app-input-toolbar -mt-px flex flex-wrap items-center justify-between gap-2 px-3 py-1.5">
          <div
            className={`${poppinsClassName} flex flex-wrap items-center gap-1 text-[10px] text-slate-600`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => void handleFilesSelected(event.target.files)}
            />
            <div className="relative" ref={actionMenuRef}>
              <button
                type="button"
                onClick={() => setIsActionMenuOpen((current) => !current)}
                className="inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[8px] hover:bg-slate-100"
                aria-label="Open actions"
                data-tooltip="Attach files and more..."
                aria-expanded={isActionMenuOpen}
              >
                <Plus size={15} />
              </button>

              {isActionMenuOpen && (
                <div className="app-card absolute bottom-full left-0 z-20 mb-2 min-w-[132px] rounded-[10px] border border-slate-200 bg-white p-1 shadow-[0_12px_30px_rgba(15,23,42,0.10)]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsActionMenuOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-[8px] px-2 py-1.5 text-left text-[10px] text-slate-700 transition hover:bg-slate-50"
                    data-tooltip="Attach photos"
                  >
                    <Paperclip size={11} />
                    Attach photos
                  </button>
                  {showWebSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setWebSearchEnabled((current) => !current);
                        setIsActionMenuOpen(false);
                      }}
                      className={cn(
                        "app-websearch-menu-btn flex w-full cursor-pointer items-center gap-2 rounded-[8px] px-2 py-1.5 text-left text-[10px] transition hover:bg-slate-50",
                        webSearchEnabled
                          ? "bg-sky-50 text-sky-700"
                          : "text-slate-700",
                      )}
                      data-tooltip={
                        webSearchEnabled
                          ? "Disable web search"
                          : "Enable web search"
                      }
                    >
                      <Globe size={11} />
                      Web search
                    </button>
                  )}
                </div>
              )}
            </div>
            {showWebSearch && webSearchEnabled && (
              <button
                type="button"
                onClick={() => setWebSearchEnabled(false)}
                className="app-websearch-pill group inline-flex cursor-pointer items-center gap-1 rounded-[8px] border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
                aria-label="Disable web search"
                data-tooltip="Disable web search"
              >
                <span className="grid place-items-center">
                  <Globe size={11} className="group-hover:hidden" />
                  <X size={11} className="hidden group-hover:block" />
                </span>
                <span>Web search</span>
              </button>
            )}
            {supportsWebSpeech === false ? (
              <div className="group relative">
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="relative inline-flex cursor-not-allowed items-center gap-1 rounded-[8px] px-1.5 py-1 text-slate-400"
                  data-tooltip="Voice input not supported on this browser"
                >
                  <Mic size={11} /> Voice
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-1/2 h-5 w-px -translate-x-1/2 -translate-y-1/2 rotate-[-36deg] bg-red-500"
                  />
                </button>

                <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-56 -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-[10px] leading-4 text-white shadow-[0_12px_30px_rgba(15,23,42,0.22)] group-hover:block group-focus-within:block">
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
                className="inline-flex h-[30px] cursor-pointer items-center gap-1 rounded-[8px] px-2 hover:bg-slate-100 disabled:cursor-not-allowed"
                data-tooltip={
                  isListening ? "Stop listening" : "Start voice input"
                }
              >
                <Mic size={14} className={cn(isListening && "text-sky-600")} />{" "}
                {isListening ? "Listening..." : "Voice"}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {content.length >= 3000 && (
              <span className="text-[10px] text-amber-700">
                Max limit reached
              </span>
            )}
            {isUploadingAttachments && content.length < 3000 && (
              <span className="text-[10px] text-slate-500">
                Uploading images...
              </span>
            )}
            {attachmentError &&
              !isUploadingAttachments &&
              content.length < 3000 && (
                <span className="text-[10px] text-amber-700">
                  {attachmentError}
                </span>
              )}
            {voiceError && !attachmentError && content.length < 3000 && (
              <span className="text-[10px] text-amber-700">{voiceError}</span>
            )}
            <button
              type="button"
              onClick={handleSend}
              disabled={
                isStreaming ||
                isUploadingAttachments ||
                (!content.trim() && attachments.length === 0)
              }
              className={cn(
                "app-send-button inline-flex h-[30px] w-[30px] items-center justify-center rounded-full bg-black text-white",
                isStreaming ||
                  isUploadingAttachments ||
                  (!content.trim() && attachments.length === 0)
                  ? "cursor-not-allowed opacity-45"
                  : "cursor-pointer transition hover:bg-slate-800",
              )}
              aria-label="Send"
              data-tooltip="Send message"
            >
              <ArrowUp size={13} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
