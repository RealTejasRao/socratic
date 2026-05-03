"use client";

import { motion } from "framer-motion";
import { LockKeyhole } from "lucide-react";

type SecuritySeparatorProps = {
  interClassName: string;
};

export function SecuritySeparator({ interClassName }: SecuritySeparatorProps) {
  return (
    <section
      aria-label="Chat security separator"
      className="relative z-10 -mb-3 -mt-10 -translate-y-8 bg-transparent px-6 py-4 sm:-mb-4 sm:-mt-12 sm:px-8 sm:py-5"
    >
      <div className="mx-auto w-full max-w-280">
        <div className="relative overflow-hidden rounded-xl border border-black/12 bg-[#fefefc] px-5 py-4.5 sm:px-7 sm:py-5.5">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <motion.div
              className="absolute left-0 top-1/2 h-px w-[38%] bg-gradient-to-r from-black/20 to-black/55"
              animate={{ x: [0, 28, 0], opacity: [0.28, 1, 0.28], scaleY: [1, 1.2, 1] }}
              transition={{ duration: 1.28, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute right-0 top-1/2 h-px w-[38%] bg-gradient-to-l from-black/20 to-black/55"
              animate={{ x: [0, -28, 0], opacity: [0.28, 1, 0.28], scaleY: [1, 1.2, 1] }}
              transition={{ duration: 1.28, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute left-[39%] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-black/65"
              animate={{ scale: [0.78, 1.45, 0.78], opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 1.28, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute right-[39%] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-black/65"
              animate={{ scale: [0.78, 1.45, 0.78], opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 1.28, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <div className="relative flex flex-col items-center justify-center gap-2.5 text-center">
            <motion.div
              className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-black/12 bg-[#fefefc]"
              animate={{ y: [0, -2.5, 0], scale: [1, 1.045, 1] }}
              transition={{ duration: 1.75, repeat: Infinity, ease: "easeInOut" }}
            >
              <LockKeyhole className="h-7 w-7 text-black/85" />
            </motion.div>
            <p
              className={`${interClassName} text-[0.84rem] font-medium tracking-[0.02em] text-black/78 sm:text-[0.9rem]`}
            >
              Your conversations stay private. Always.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
