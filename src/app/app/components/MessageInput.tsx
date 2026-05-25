"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ClipboardEvent,
} from "react";
import { usePathname } from "next/navigation";
import {
  ArrowUp,
  Globe,
  LoaderCircle,
  Mic,
  Paperclip,
  Plus,
  Square,
  X,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { buildChatAttachmentPreviewUrl } from "@/src/lib/cloudinary";
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
  onRestrictionReached?: (reason: string) => void;
  onStop?: () => void;
  isStreaming: boolean;
  isPremium?: boolean;
  dailyMessagesRemaining?: number | null;
  dailyImageUploadsRemaining?: number | null;
  initialValue: string | undefined;
  variant?: "default" | "hero";
  placeholder?: string;
  showWebSearch?: boolean;
  allowImageAttachments?: boolean;
}

interface ComposerImageAttachment {
  id: string;
  previewUrl: string;
  name: string;
  status: "uploading" | "ready" | "error";
  isLocalOnly?: boolean;
  attachment?: ChatImageAttachment;
}

interface SignedUploadPayload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

interface UploadSignErrorPayload {
  reason?: string;
}

const MAX_ATTACHMENTS = 3;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const DAILY_MESSAGES_LIMIT_REASON =
  "Daily free limit reached. Upgrade to Socratic+ for unlimited messages.";
const DAILY_IMAGE_UPLOAD_LIMIT_REASON =
  "Daily free image upload limit reached. Upgrade to Socratic+ for unlimited image uploads.";

export default function MessageInput({
  onSend,
  onRestrictionReached,
  onStop,
  isStreaming,
  isPremium = false,
  dailyMessagesRemaining = null,
  dailyImageUploadsRemaining = null,
  initialValue,
  variant = "default",
  placeholder = "What's on your mind?",
  showWebSearch = true,
  allowImageAttachments = true,
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
  const [previewImage, setPreviewImage] = useState<{
    name: string;
    dataUrl: string;
  } | null>(null);
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
  const hasVerifiedMicrophoneAccessRef = useRef(false);
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
  const hasAnyComposerAttachment = composerAttachments.length > 0;
  const isUploadingAttachments = composerAttachments.some(
    (item) => item.status === "uploading",
  );
  const canShowActionMenu = allowImageAttachments || showWebSearch;

  function isPhoneViewport() {
    if (typeof window === "undefined") {
      return false;
    }

    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const phoneWidth = window.matchMedia("(max-width: 767px)").matches;
    const userAgent = navigator.userAgent || "";
    const mobileUa =
      /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent,
      );

    return (coarsePointer && phoneWidth) || (mobileUa && phoneWidth);
  }

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
      if (event.error === "aborted" && isStoppingRecognitionRef.current) {
        return;
      }

      const nextError =
        event.error === "not-allowed"
          ? "Microphone permission was denied."
          : event.error === "audio-capture"
            ? "No microphone was detected."
          : event.error === "no-speech"
            ? "I couldn't hear anything. Try again."
            : "Voice dictation ran into a problem.";

      if (event.error === "not-allowed") {
        hasVerifiedMicrophoneAccessRef.current = false;
      }
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

  async function ensureMicrophoneAccess() {
    if (hasVerifiedMicrophoneAccessRef.current) {
      return true;
    }

    if (!window.isSecureContext) {
      setVoiceError("Voice input needs HTTPS or localhost.");
      return false;
    }

    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices?.getUserMedia) {
      setVoiceError("Microphone access is not available in this browser.");
      return false;
    }

    if ("permissions" in navigator && typeof navigator.permissions.query === "function") {
      try {
        const permissionStatus = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });

        if (permissionStatus.state === "denied") {
          setVoiceError("Microphone permission was denied.");
          return false;
        }
      } catch {
        // Ignore Permissions API errors and continue with a direct audio request.
      }
    }

    try {
      const stream = await mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      hasVerifiedMicrophoneAccessRef.current = true;
      return true;
    } catch (error) {
      const errorName = error instanceof DOMException ? error.name : "";
      const nextError =
        errorName === "NotAllowedError" || errorName === "SecurityError"
          ? "Microphone permission was denied."
          : errorName === "NotFoundError" || errorName === "DevicesNotFoundError"
            ? "No microphone was detected."
            : errorName === "NotReadableError" || errorName === "TrackStartError"
              ? "Microphone is busy in another app."
              : "Voice input couldn't access your microphone.";

      setVoiceError(nextError);
      return false;
    }
  }

  async function handleVoiceToggle() {
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

    const canUseMicrophone = await ensureMicrophoneAccess();
    if (!canUseMicrophone) {
      return;
    }

    try {
      voiceBaseContentRef.current = content;
      setVoiceError("");
      recognition.start();
      setIsListening(true);
      textareaRef.current?.focus();
    } catch (error) {
      if (error instanceof DOMException && error.name === "InvalidStateError") {
        setIsListening(true);
        return;
      }

      setIsListening(false);
      setVoiceError("Voice dictation could not start.");
    }
  }

  function handleSend() {
    if (
      (!content.trim() && !hasAnyComposerAttachment) ||
      isStreaming ||
      isUploadingAttachments
    ) {
      return;
    }

    if (!isPremium && (dailyMessagesRemaining ?? 0) <= 0) {
      onRestrictionReached?.(DAILY_MESSAGES_LIMIT_REASON);
      return;
    }

    if (
      !isPremium &&
      composerAttachments.length > 0 &&
      (dailyImageUploadsRemaining ?? 0) <= 0
    ) {
      onRestrictionReached?.(DAILY_IMAGE_UPLOAD_LIMIT_REASON);
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
    setPreviewImage(null);
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
      let errorMessage = "Could not initialize image upload.";
      const contentType = signRes.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        const payload = (await signRes.json()) as UploadSignErrorPayload;
        if (typeof payload.reason === "string" && payload.reason.trim()) {
          errorMessage = payload.reason.trim();
        }
      } else {
        const text = await signRes.text();
        if (text.trim()) {
          errorMessage = text.trim();
        }
      }

      if (signRes.status === 402) {
        onRestrictionReached?.(errorMessage);
      }

      throw new Error(errorMessage);
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

  async function processSelectedImageFiles(filesArray: File[]) {
    if (!allowImageAttachments) {
      return;
    }

    if (filesArray.length === 0) return;

    const availableSlots = Math.max(
      0,
      MAX_ATTACHMENTS - attachmentsRef.current.length,
    );

    if (availableSlots === 0) {
      setAttachmentError(`You can attach up to ${MAX_ATTACHMENTS} images.`);
      return;
    }

    const selectedFiles = filesArray.slice(0, availableSlots);

    if (filesArray.length > availableSlots) {
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

      if (
        !isPremium &&
        ((dailyMessagesRemaining ?? 0) <= 0 ||
          (dailyImageUploadsRemaining ?? 0) <= 0)
      ) {
        setComposerAttachments((current) => [
          ...current,
          {
            id: attachmentId,
            previewUrl,
            name: file.name,
            status: "ready",
            isLocalOnly: true,
          },
        ]);
        continue;
      }

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
      } catch (error) {
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

        const fallbackMessage = "One or more images failed to upload.";
        const detail =
          error instanceof Error && error.message.trim()
            ? error.message.trim()
            : fallbackMessage;
        const isFreeUploadLimit =
          detail.toLowerCase().includes("daily free image upload limit") ||
          detail.toLowerCase().includes("unlimited image uploads");
        setAttachmentError(isFreeUploadLimit ? "" : detail);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleFilesSelected(files: FileList | null) {
    if (!files?.length) return;
    await processSelectedImageFiles(Array.from(files));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleTextareaPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    if (!allowImageAttachments) {
      return;
    }

    const clipboardItems = event.clipboardData?.items;

    if (!clipboardItems?.length) {
      return;
    }

    const imageFiles: File[] = [];

    for (const item of Array.from(clipboardItems)) {
      if (item.kind !== "file") {
        continue;
      }

      const file = item.getAsFile();

      if (file && file.type.startsWith("image/")) {
        imageFiles.push(file);
      }
    }

    if (imageFiles.length === 0) {
      return;
    }

    event.preventDefault();
    void processSelectedImageFiles(imageFiles);
  }

  return (
    <div
      className={cn(
        "mx-auto w-full",
        variant === "hero" ? "max14" : "max-w-155",
      )}
    >
      <div
        className={cn(
          "app-input-shell overflow-visible border border-transparent bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12),0_8px_24px_rgba(15,23,42,0.045)]",
          variant === "hero" ? "rounded-[14px]" : "rounded-[12px]",
        )}
      >
        {composerAttachments.length > 0 && (
          <div className="app-input-attachments flex flex-wrap gap-2 px-3.5 py-2.5">
            {composerAttachments.map((attachment) => (
              <div
                key={attachment.id}
                className="app-card relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (
                      attachment.status !== "ready" ||
                      (!attachment.attachment && !attachment.isLocalOnly)
                    ) {
                      return;
                    }

                    setPreviewImage({
                      name: attachment.name,
                      dataUrl: attachment.attachment?.dataUrl ?? attachment.previewUrl,
                    });
                  }}
                  disabled={attachment.status !== "ready"}
                  className={cn(
                    "block overflow-hidden",
                    attachment.status === "ready"
                      ? "cursor-zoom-in"
                      : "cursor-default",
                  )}
                  aria-label={`Open ${attachment.name} preview`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={attachment.previewUrl}
                    alt={attachment.name}
                    className="h-12 w-12 object-cover"
                  />
                </button>
                {attachment.status === "uploading" && (
                  <div className="absolute inset-0 grid place-items-center bg-white/60">
                    <div className="grid h-6 w-6 place-items-center rounded-full bg-white/90 shadow-sm">
                      <LoaderCircle
                        size={14}
                        className="animate-spin text-slate-600"
                      />
                    </div>
                  </div>
                )}
                {attachment.status === "error" && (
                  <div className="absolute inset-0 grid place-items-center bg-rose-50/90 text-[10px] font-medium text-rose-700">
                    Failed
                  </div>
                )}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeAttachmentById(attachment.id);
                  }}
                  className="app-input-attachment-remove-btn absolute top-1 right-1 cursor-pointer rounded-xl p-1 shadow-sm transition"
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
          onPaste={handleTextareaPaste}
          placeholder={placeholder}
          maxLength={3000}
          rows={1}
          className={cn(
            `${poppinsClassName} app-input-textarea block w-full resize-none text-slate-900 outline-none placeholder:text-slate-400`,
            variant === "hero"
              ? "min-h-14 px-4.5 pt-2.5 pb-1.5 text-[16px] leading-6 md:min-h-14 md:px-4.5 md:pt-2.5 md:pb-1.5 md:text-[16px] md:leading-6"
              : "min-h-14 px-4 pt-3 pb-2 text-[16px] leading-6.5 md:min-h-10 md:px-3.5 md:pt-2 md:pb-1.5 md:text-[12px] md:leading-5",
          )}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !isPhoneViewport()
            ) {
              event.preventDefault();
              handleSend();
            }
          }}
        />

        <div
          className={cn(
            "app-input-toolbar -mt-px flex flex-wrap items-center justify-between gap-2",
            variant === "hero"
              ? "px-3.5 py-1.5 md:px-3.5 md:py-1.5"
              : "px-3.5 py-2",
          )}
        >
          <div
            className={cn(
              `${poppinsClassName} flex flex-wrap items-center text-slate-600`,
              variant === "hero"
                ? "gap-1.5 text-[14px] md:gap-1.5 md:text-[14px]"
                : "gap-1.5 text-[14px] md:gap-1 md:text-[10px]",
            )}
          >
            {canShowActionMenu && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) =>
                    void handleFilesSelected(event.target.files)
                  }
                />
                <div className="relative" ref={actionMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsActionMenuOpen((current) => !current)}
                    className={cn(
                      "app-input-action-btn inline-flex cursor-pointer items-center justify-center hover:bg-slate-100",
                      variant === "hero"
                        ? "h-10 w-10 rounded-xl md:h-10 md:w-10"
                        : "h-10 w-10 rounded-xl md:h-7.5 md:w-7.5",
                    )}
                    aria-label="Open actions"
                    data-tooltip="Attach files and more..."
                    aria-expanded={isActionMenuOpen}
                  >
                    <Plus
                      size={variant === "hero" ? 20 : 21}
                      className={cn(variant === "hero" ? "" : "md:hidden")}
                    />
                    <Plus
                      size={15}
                      className={cn(variant === "hero" ? "hidden" : "hidden md:block")}
                    />
                  </button>

                  {isActionMenuOpen && (
                    <div className="app-card absolute bottom-full left-0 z-20 mb-2 min-w-37 rounded-[12px] border border-slate-200 bg-white p-1.5 shadow-[0_12px_30px_rgba(15,23,42,0.10)]">
                      {allowImageAttachments && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsActionMenuOpen(false);
                            fileInputRef.current?.click();
                          }}
                          className="flex w-full cursor-pointer items-center gap-2 rounded-[12px] px-2.5 py-2 text-left text-[13px] text-slate-700 transition hover:bg-slate-50 md:py-2 md:text-[13px]"
                          data-tooltip="Attach photos"
                        >
                          <Paperclip size={16} className="md:hidden" />
                          <Paperclip size={16} className="hidden md:block" />
                          Attach photos
                        </button>
                      )}
                      {showWebSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setWebSearchEnabled((current) => !current);
                            setIsActionMenuOpen(false);
                          }}
                          className={cn(
                            "app-websearch-menu-btn flex w-full cursor-pointer items-center gap-2 rounded-[12px] px-2.5 py-2 text-left text-[13px] transition hover:bg-slate-50 md:py-2 md:text-[13px]",
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
                          <Globe size={16} className="md:hidden" />
                          <Globe size={16} className="hidden md:block" />
                          Web search
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
            {showWebSearch && webSearchEnabled && (
              <button
                type="button"
                onClick={() => setWebSearchEnabled(false)}
                className="app-websearch-pill group inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-[14px] text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 md:gap-1.5 md:px-3 md:py-2 md:text-[14px]"
                aria-label="Disable web search"
                data-tooltip="Disable web search"
              >
                <span className="grid place-items-center">
                  <Globe size={16} className="group-hover:hidden" />
                  <X size={16} className="hidden group-hover:block" />
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
                  className="relative inline-flex cursor-not-allowed items-center gap-1.5 rounded-xl px-1.5 py-1 text-[14px] text-slate-400 md:text-[10px]"
                  data-tooltip="Voice input not supported on this browser"
                >
                  <Mic size={16} className="md:h-2.75 md:w-2.75" /> Voice
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
                onClick={() => void handleVoiceToggle()}
                disabled={isStreaming}
                className={cn(
                  "app-input-action-btn inline-flex cursor-pointer items-center hover:bg-slate-100 disabled:cursor-not-allowed",
                  variant === "hero"
                    ? "h-9 gap-1.5 rounded-xl px-2 md:h-9 md:gap-1.5 md:px-2"
                    : "h-9 gap-1.5 rounded-xl px-2 md:h-7 md:gap-1 md:px-2",
                )}
                data-tooltip={
                  isListening ? "Stop listening" : "Start voice input"
                }
              >
                <Mic
                  size={variant === "hero" ? 17 : 17}
                  className={cn(
                    variant === "hero" ? "md:h-4.25 md:w-4.25" : "md:h-3.75 md:w-3.75",
                    isListening && "text-sky-600",
                  )}
                />{" "}
                {isListening ? "Listening..." : "Voice"}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {content.length >= 3000 && (
              <span className="app-input-max-limit-error text-[12px] leading-4 text-amber-700 md:text-[11px]">
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
                <span className="app-input-attachment-error text-[12px] leading-4 text-amber-700 md:text-[11px]">
                  {attachmentError}
                </span>
              )}
            {voiceError && !attachmentError && content.length < 3000 && (
              <span className="text-[12px] leading-4 text-amber-700 md:text-[11px]">
                {voiceError}
              </span>
            )}
            <button
              type="button"
              onClick={isStreaming ? () => onStop?.() : handleSend}
              disabled={
                isUploadingAttachments ||
                (!isStreaming && !content.trim() && !hasAnyComposerAttachment)
              }
              className={cn(
                variant === "hero"
                  ? "app-send-button inline-flex h-9 w-9 items-center justify-center rounded-full bg-black text-white md:h-9 md:w-9"
                  : "app-send-button inline-flex h-9 w-9 items-center justify-center rounded-full bg-black text-white md:h-7 md:w-7",
                isUploadingAttachments ||
                  (!isStreaming && !content.trim() && !hasAnyComposerAttachment)
                  ? "cursor-not-allowed opacity-45"
                  : isStreaming
                    ? "cursor-pointer transition hover:bg-rose-700"
                    : "cursor-pointer transition hover:bg-slate-800",
              )}
              aria-label={isStreaming ? "Stop generating" : "Send"}
              data-tooltip={isStreaming ? "Stop generating" : "Send message"}
            >
              {isStreaming ? (
                <Square
                  size={variant === "hero" ? 13 : 13}
                  fill="currentColor"
                  className={cn(
                    variant === "hero" ? "md:h-3.25 md:w-3.25" : "md:h-2.75 md:w-2.75",
                  )}
                />
              ) : (
                <>
                  <ArrowUp
                    size={variant === "hero" ? 16 : 16}
                    strokeWidth={2.4}
                    className={cn(variant === "hero" ? "" : "md:hidden")}
                  />
                  <ArrowUp
                    size={12}
                    strokeWidth={2.4}
                    className={cn(variant === "hero" ? "hidden" : "hidden md:block")}
                  />
                </>
              )}
            </button>
          </div>
        </div>
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
            data-tooltip="Close image preview"
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
