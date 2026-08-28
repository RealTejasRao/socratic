"use client";

import { motion } from "framer-motion";
import { LockKeyhole } from "lucide-react";

type SecuritySeparatorProps = {
  interClassName: string;
  message?: string;
  highlightedTerm?: string;
};

export function SecuritySeparator({
  interClassName,
  message = "Your conversations stay private. Always.",
  highlightedTerm = "private",
}: SecuritySeparatorProps) {
  const highlightedStart = message.indexOf(highlightedTerm);
  const highlightedEnd = highlightedStart + highlightedTerm.length;
  const renderedMessage = message.split("").map((char, index) => (
    <span
      key={`${char}-${index}`}
      className={
        highlightedStart >= 0 && index >= highlightedStart && index < highlightedEnd
          ? "text-[#166534]"
          : ""
      }
    >
      {char}
    </span>
  ));

  return (
    <section
      aria-label="Chat security separator"
      className="relative z-10 -mb-2.5 -mt-5 -translate-y-4 bg-transparent px-5 py-2.5 sm:-mb-3 sm:-mt-10 sm:px-7 sm:py-3"
    >
      <div className="mx-auto w-full max-w-280">
        <div className="relative px-1 py-1.5 sm:px-2 sm:py-2">
          <div className="relative flex items-center justify-center gap-3">
            <motion.div
              className="h-px w-full max-w-40 bg-gradient-to-r from-black/12 via-[#166534]/40 to-[#166534]/62"
              animate={{ opacity: [0.35, 0.8, 0.35], x: [0, 8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="relative inline-flex h-8.5 w-8.5 items-center justify-center rounded-full border border-[#166534]/28 bg-white"
              animate={{ y: [0, -1.5, 0], scale: [1, 1.04, 1] }}
              transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
            >
              <LockKeyhole className="h-4.5 w-4.5 text-[#166534]" />
            </motion.div>
            <motion.div
              className="h-px w-full max-w-40 bg-gradient-to-l from-black/12 via-[#166534]/40 to-[#166534]/62"
              animate={{ opacity: [0.35, 0.8, 0.35], x: [0, -8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <p
            className={`${interClassName} mt-2 text-center text-[0.8rem] font-medium tracking-[0.01em] text-black/72 sm:text-[0.82rem]`}
          >
            {renderedMessage}
          </p>
          <motion.div
            className="mx-auto mt-1 h-px w-full max-w-56 bg-gradient-to-r from-transparent via-[#166534]/24 to-transparent"
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </section>
  );
}
