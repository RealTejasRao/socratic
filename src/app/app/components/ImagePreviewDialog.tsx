"use client";

import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { buildChatAttachmentPreviewUrl } from "@/src/lib/cloudinary";

interface ImagePreviewDialogProps {
  image: {
    name: string;
    dataUrl: string;
  };
  onClose: () => void;
}

export default function ImagePreviewDialog({
  image,
  onClose,
}: ImagePreviewDialogProps) {
  const portalTarget = typeof document === "undefined" ? null : document.body;

  if (!portalTarget) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80"
      style={{
        paddingTop: "calc(1rem + env(safe-area-inset-top))",
        paddingRight: "calc(1rem + env(safe-area-inset-right))",
        paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
        paddingLeft: "calc(1rem + env(safe-area-inset-left))",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${image.name}`}
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute rounded-full border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20"
        style={{
          top: "calc(1rem + env(safe-area-inset-top))",
          right: "calc(1rem + env(safe-area-inset-right))",
        }}
        onClick={onClose}
        aria-label="Close image preview"
        data-tooltip="Close image preview"
      >
        <X size={18} />
      </button>
      <div
        className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl"
        style={{
          maxWidth:
            "calc(100vw - 2rem - env(safe-area-inset-left) - env(safe-area-inset-right))",
          maxHeight:
            "calc(100svh - 2rem - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={buildChatAttachmentPreviewUrl(image.dataUrl)}
          alt={image.name}
          className="block object-contain"
          style={{
            maxWidth:
              "calc(100vw - 2rem - env(safe-area-inset-left) - env(safe-area-inset-right))",
            maxHeight:
              "calc(100svh - 2rem - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
          }}
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>,
    portalTarget,
  );
}
