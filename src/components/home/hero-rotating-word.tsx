"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const WORDS = ["Philosophy", "Deep Convos", "Wisdom", "Growth"] as const;
const ROTATION_MS = 4000;
const EASE = [0.22, 1, 0.36, 1] as const;

export function HeroRotatingWord({
  align = "left",
}: {
  align?: "left" | "center";
}) {
  const [wordIndex, setWordIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const interval = window.setInterval(() => {
      setWordIndex((current) => (current + 1) % WORDS.length);
    }, ROTATION_MS);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <span
      className={`relative inline-grid w-[10.5ch] align-baseline whitespace-nowrap ${
        align === "center" ? "text-center" : "text-left"
      }`}
    >
      <span className="invisible col-start-1 row-start-1 italic">Philosophy</span>
      <span className="col-start-1 row-start-1 inline-block h-[1em] overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={WORDS[wordIndex]}
            className={
              align === "center"
                ? "absolute left-1/2 top-0 inline-block -translate-x-1/2 italic text-[#A01717]"
                : "absolute left-0 top-0 inline-block italic text-[#A01717]"
            }
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: "0.38em" }
            }
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: "-0.38em" }
            }
            transition={{ duration: 0.52, ease: EASE }}
          >
            {WORDS[wordIndex]}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}
