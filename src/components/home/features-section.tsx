"use client";

import {
  Brain,
  MessageSquareMore,
  Route,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { motion, type Variants, useInView } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

type FeaturesSectionProps = {
  interClassName: string;
};

type FeaturesItem = {
  id: string;
  icon: LucideIcon;
  title: ReactNode;
  description: string;
};

const featuresItems: FeaturesItem[] = [
  {
    id: "argues-back",
    icon: MessageSquareMore,
    title: (
      <>
        It Argues Back.
        <br />
        By Design.
      </>
    ),
    description:
      "Most AI tells you what you want to hear. This one is wired to push back readily.",
  },
  {
    id: "corpus",
    icon: Brain,
    title: "A Corpus Built for Philosophers",
    description:
      "Responses based on original writings, not skimmed Reddit summaries.",
  },
  {
    id: "model-of-you",
    icon: Route,
    title: (
      <>
        It Builds a Model,
        <br />
        of You
      </>
    ),
    description:
      "Actively tracks your beliefs and assumptions, connects them into a living model of your thinking.",
  },
  {
    id: "clarity",
    icon: Sparkles,
    title: "Clarity You Can Take With You",
    description:
      "Discover positions you didn't know you held, gaps you didn't know were there.",
  },
];

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const listVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 26, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const SECTION_HEADING_TEXT = "Built Different.\nBuilt For Philosophy";

export function FeaturesSection({ interClassName }: FeaturesSectionProps) {
  const headingRef = useRef<HTMLSpanElement | null>(null);
  const headingInView = useInView(headingRef, { once: true, amount: 0.8 });
  const [visibleHeadingChars, setVisibleHeadingChars] = useState(0);
  const [restartSignal, setRestartSignal] = useState(0);
  const typedHeading = SECTION_HEADING_TEXT.slice(0, visibleHeadingChars);
  const displayHeading = typedHeading.endsWith("\n")
    ? typedHeading.slice(0, -1)
    : typedHeading;

  useEffect(() => {
    const onRestart = (event: Event) => {
      const customEvent = event as CustomEvent<{ sectionId?: string }>;
      if (customEvent.detail?.sectionId !== "features") return;
      setVisibleHeadingChars(0);
      setRestartSignal((count) => count + 1);
    };

    window.addEventListener("section:typewriter:restart", onRestart);
    return () => window.removeEventListener("section:typewriter:restart", onRestart);
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash !== "#features") return;
      setVisibleHeadingChars(0);
      setRestartSignal((count) => count + 1);
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!headingInView && restartSignal === 0) return;

    const interval = window.setInterval(() => {
      setVisibleHeadingChars((count) => {
        if (count >= SECTION_HEADING_TEXT.length) {
          window.clearInterval(interval);
          return count;
        }
        return count + 1;
      });
    }, 58);

    return () => window.clearInterval(interval);
  }, [headingInView, restartSignal]);

  return (
    <section
      id="features"
      className="relative scroll-mt-1 bg-[#fefefc] px-6 py-20 sm:px-8 sm:py-24 lg:py-28"
    >
      <div className="mx-auto w-full max-w-365">
        <motion.div
          className="mx-auto max-w-210 text-center"
          variants={sectionVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <h2
            className={`${interClassName} text-[clamp(1.2rem,2.6vw,2.2rem)] font-medium leading-tight text-black`}
          >
            <span ref={headingRef} className="inline-grid align-top">
              <span
                className="col-start-1 row-start-1 invisible whitespace-pre-line"
                aria-hidden="true"
              >
                {SECTION_HEADING_TEXT}
              </span>
              <span className="col-start-1 row-start-1 whitespace-pre-line">
                {displayHeading}
                {visibleHeadingChars > 0 ? "" : ""}
                <span className="hero-caret" aria-hidden="true" />
              </span>
            </span>
          </h2>
          <p className="mx-auto mt-8 inline-flex max-w-210 items-center gap-2 text-[clamp(0.8rem,1.1vw,1.05rem)] leading-[1.75] text-black/60">
            <span
              className="relative inline-flex h-2.5 w-2.5 items-center justify-center"
              aria-hidden="true"
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-500/55" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-pink-500" />
            </span>
            <span>
              Not any Generic AI - Designed from the ground up to make you a
              sharper thinker.
            </span>
          </p>
        </motion.div>

        <motion.div
          className="relative mt-12 grid grid-cols-1 gap-8 md:mt-14 md:grid-cols-2 md:gap-y-10 xl:grid-cols-4 xl:gap-y-0"
          variants={listVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          {/*dividers for md (2 columns) */}
          <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-linear-to-b from-transparent via-neutral-400/30 to-transparent md:block xl:hidden" />

          {/*dividers for xl (4 columns) */}
          <div className="pointer-events-none absolute inset-y-0 left-1/4 hidden w-px -translate-x-1/2 bg-linear-to-b from-transparent via-neutral-400/50 to-transparent xl:block" />
          <div className="pointer-events-none absolute inset-y-0 left-2/4 hidden w-px -translate-x-1/2 bg-linear-to-b from-transparent via-neutral-400/50 to-transparent xl:block" />
          <div className="pointer-events-none absolute inset-y-0 left-3/4 hidden w-px -translate-x-1/2 bg-linear-to-b from-transparent via-neutral-400/50 to-transparent xl:block" />

          {featuresItems.map((item) => {
            const Icon = item.icon;

            return (
              <motion.article
                key={item.id}
                variants={cardVariants}
                className="py-1 md:px-8 md:py-5 xl:px-9"
              >
                <Icon className="h-5 w-5 stroke-2 text-neutral-800" />
                <h3
                  className={`${interClassName} mt-6 text-[clamp(0.95rem,1.45vw,1.3rem)] font-medium leading-tight tracking-[-0.01em] text-neutral-900`}
                >
                  {item.title}
                </h3>
                <p className="mt-12 max-w-[20rem] text-[clamp(0.72rem,0.95vw,0.92rem)] leading-relaxed text-neutral-600">
                  {item.description}
                </p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
