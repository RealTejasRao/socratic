"use client";

import Image from "next/image";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Instrument_Serif } from "next/font/google";
import {
  ArrowRight,
  BookOpenText,
  Image as ImageIcon,
  Landmark,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";
import { resolveOptimizedCloudinaryPublicAsset } from "@/src/lib/cloudinary-public-assets";

type UseCasesSectionProps = {
  interClassName: string;
};

type UseCaseItem = {
  id: string;
  icon: LucideIcon;
  leftTitle: string;
  leftDescription: string;
  rightTitle: string;
  rightDescription: string;
  placeholderLabel: string;
  imageSrc?: string;
};

const useCaseItems: UseCaseItem[] = [
  {
    id: "deep-conversations",
    icon: MessagesSquare,
    leftTitle: "Deep Conversations",
    leftDescription:
      "Have the discussions your daily life doesn't make room for.",
    rightTitle: "Finally Someone to Think Out Loud With.",
    rightDescription:
      "Have the deep conversations you've always wanted, at any hour, with someone who takes you seriously. No judgment, no distraction. Just thinking. Together.",
    placeholderLabel: "Deep conversations related image.",
    imageSrc: "/media/useCasesSection/first.webp",
  },
  {
    id: "debate-drills",
    icon: BookOpenText,
    leftTitle: "Debate Drills",
    leftDescription:
      "Debate with our AI that never goes easy on you, so the real thing feels effortless.",
    rightTitle: "Turn Your Ideas Into Powerful Arguments.",
    rightDescription:
      "It maps every claim you make, tracks your logic in real time, and fires back with the most precise counter it can find; then turns around and guides you toward the stronger version of it.",
    placeholderLabel: "Passage Analysis Preview",
    imageSrc: "/media/useCasesSection/second.webp",
  },
  {
    id: "all-of-philosophy",
    icon: Landmark,
    leftTitle: "All of Philosophy",
    leftDescription:
      "Dive into any philosophical idea or thinker and actually come out understanding it.",
    rightTitle: "The Entire History of Human Thought, Ready to Discuss.",
    rightDescription:
      "Understand any philosopher, any idea, the way it was always meant to be - through conversation, not a textbook. From the ancient Greeks to modern existentialists, from Stoicism to Nihilism. ",
    placeholderLabel: "Belief Graph Preview",
    imageSrc: "/media/useCasesSection/third.webp",
  },
];

const USE_CASES_HEADING_TEXT = "One AI, Endless Directions";
const MOBILE_FIRST_LINE_TEXT = "One AI";
const MOBILE_SECOND_LINE_TEXT = "Endless Directions";
const ENDLESS_WORD = "Endless";
const endlessStart = Math.max(0, USE_CASES_HEADING_TEXT.indexOf(ENDLESS_WORD));
const endlessEnd = endlessStart + ENDLESS_WORD.length;
const mobileFirstLineLength = MOBILE_FIRST_LINE_TEXT.length;
const mobileSecondLineStart = Math.max(
  0,
  USE_CASES_HEADING_TEXT.indexOf(MOBILE_SECOND_LINE_TEXT),
);
const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
});
const heroSlideEase: [number, number, number, number] = [0.22, 1, 0.36, 1];
const heroLoadInitial = {
  opacity: 0,
  y: 34,
  scale: 0.988,
};
const heroLoadInView = {
  opacity: 1,
  y: 0,
  scale: 1,
};
const useCasesCardInitial = {
  opacity: 0,
  y: 56,
  scale: 0.965,
  rotateX: 10,
};
const useCasesCardInView = {
  opacity: 1,
  y: 0,
  scale: 1,
  rotateX: 0,
};
const leftRailInitial = {
  opacity: 0,
  x: -52,
  y: 18,
};
const leftRailInView = {
  opacity: 1,
  x: 0,
  y: 0,
};
const rightPanelInitial = {
  opacity: 0,
  x: 48,
  y: 14,
};
const rightPanelInView = {
  opacity: 1,
  x: 0,
  y: 0,
};

export function UseCasesSection({ interClassName }: UseCasesSectionProps) {
  const headingRef = useRef<HTMLSpanElement | null>(null);
  const headingInView = useInView(headingRef, { once: true, amount: 0.8 });
  const useCasesSceneRef = useRef<HTMLDivElement | null>(null);
  const useCasesSceneInView = useInView(useCasesSceneRef, {
    once: true,
    amount: 0.3,
  });
  const [activeId, setActiveId] = useState(useCaseItems[0]?.id ?? "");
  const [visibleHeadingChars, setVisibleHeadingChars] = useState(0);
  const [restartHeadingSignal, setRestartHeadingSignal] = useState(0);
  const [restartLoadSignal, setRestartLoadSignal] = useState(0);
  const activeItem =
    useCaseItems.find((item) => item.id === activeId) ?? useCaseItems[0]!;
  const useCaseImageUrls = useMemo(
    () =>
      useCaseItems.map((item) => ({
        id: item.id,
        url: item.imageSrc
          ? resolveOptimizedCloudinaryPublicAsset(item.imageSrc, {
              width: 1200,
              crop: "limit",
              quality: "auto:good",
            })
          : undefined,
      })),
    [],
  );
  const activeImageUrl = useCaseImageUrls.find(
    (item) => item.id === activeItem.id,
  )?.url;

  useEffect(() => {
    const onRestart = (event: Event) => {
      const customEvent = event as CustomEvent<{ sectionId?: string }>;
      if (customEvent.detail?.sectionId !== "use-cases") return;
      setVisibleHeadingChars(0);
      setRestartHeadingSignal((count) => count + 1);
      setRestartLoadSignal((count) => count + 1);
    };

    window.addEventListener("section:typewriter:restart", onRestart);
    return () =>
      window.removeEventListener("section:typewriter:restart", onRestart);
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash !== "#use-cases") return;
      setVisibleHeadingChars(0);
      setRestartHeadingSignal((count) => count + 1);
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!headingInView && restartHeadingSignal === 0) return;

    const interval = window.setInterval(() => {
      setVisibleHeadingChars((count) => {
        if (count >= USE_CASES_HEADING_TEXT.length) {
          window.clearInterval(interval);
          return count;
        }
        return count + 1;
      });
    }, 46);

    return () => window.clearInterval(interval);
  }, [headingInView, restartHeadingSignal]);

  useEffect(() => {
    if (!headingInView) {
      return;
    }

    for (const item of useCaseImageUrls) {
      if (!item.url) continue;
      const image = new window.Image();
      image.decoding = "async";
      image.src = item.url;
    }
  }, [headingInView, useCaseImageUrls]);

  const typedHeading = USE_CASES_HEADING_TEXT.slice(0, visibleHeadingChars);
  const typedEndlessStart = Math.min(typedHeading.length, endlessStart);
  const typedEndlessEnd = Math.min(typedHeading.length, endlessEnd);
  const typedHeadingBeforeEndless = typedHeading.slice(0, typedEndlessStart);
  const typedHeadingEndless = typedHeading.slice(
    typedEndlessStart,
    typedEndlessEnd,
  );
  const typedHeadingAfterEndless = typedHeading.slice(typedEndlessEnd);
  const typedMobileLineOne = typedHeading.slice(
    0,
    Math.min(typedHeading.length, mobileFirstLineLength),
  );
  const typedMobileLineTwo =
    typedHeading.length > mobileSecondLineStart
      ? typedHeading.slice(mobileSecondLineStart)
      : "";

  return (
    <section
      id="use-cases"
      className="relative scroll-mt-15 bg-transparent px-5 py-6 sm:px-7 sm:py-7 lg:py-8"
    >
      <div className="mx-auto w-full max-w-552">
        <motion.div
          key={`use-cases-heading-${restartLoadSignal}`}
          className="text-center"
          initial={heroLoadInitial}
          whileInView={heroLoadInView}
          viewport={{ once: true, amount: 0.7 }}
          transition={{ duration: 1.2, delay: 0.2, ease: heroSlideEase }}
        >
          <h2
            className={`${instrumentSerif.className} -translate-y-2 text-[clamp(2.4rem,9.5vw,3.35rem)] font-normal leading-tight text-black md:text-[clamp(1.62rem,4.5vw,2.7rem)] lg:-translate-y-8`}
          >
            <span ref={headingRef} className="inline-grid align-top">
              <span
                className="col-start-1 row-start-1 invisible whitespace-pre-line md:hidden"
                aria-hidden="true"
              >
                {`${MOBILE_FIRST_LINE_TEXT}\n${MOBILE_SECOND_LINE_TEXT}`}
              </span>
              <span
                className="col-start-1 row-start-1 invisible hidden md:inline"
                aria-hidden="true"
              >
                {USE_CASES_HEADING_TEXT}
              </span>
              <span className="col-start-1 row-start-1 whitespace-pre-line md:hidden">
                <span className="block">{typedMobileLineOne}</span>
                <span className="block">
                  <span className="text-[#a01717]">{typedMobileLineTwo}</span>
                  <span className="hero-caret" aria-hidden="true" />
                </span>
              </span>
              <span className="col-start-1 row-start-1 hidden md:inline">
                {typedHeadingBeforeEndless}
                <span className="text-[#a01717]">{typedHeadingEndless}</span>
                {typedHeadingAfterEndless}
                <span className="hero-caret" aria-hidden="true" />
              </span>
            </span>
          </h2>
        </motion.div>

        <div ref={useCasesSceneRef} className="mt-6 md:-mt-3">
          <div className="flex items-stretch justify-center lg:px-2 xl:px-4">
            <motion.div
              key={`use-cases-card-${restartLoadSignal}`}
              className="relative z-20 min-w-0 w-full max-w-6xl overflow-hidden rounded-2xl border border-black/25 bg-[#fefefc] outline-1 -outline-offset-1 outline-black/12 lg:w-[min(69vw,72rem)]"
              style={{ perspective: 1200 }}
              initial={useCasesCardInitial}
              animate={useCasesSceneInView ? useCasesCardInView : false}
              transition={{ duration: 1.12, delay: 0.18, ease: heroSlideEase }}
            >
              <motion.div
                className="pointer-events-none absolute inset-y-0 left-0 z-30 w-28 -translate-x-full bg-linear-to-r from-transparent via-white/55 to-transparent blur-md"
                initial={{ x: "-130%", opacity: 0 }}
                animate={
                  useCasesSceneInView
                    ? { x: ["-130%", "260%"], opacity: [0, 0.72, 0] }
                    : false
                }
                transition={{ duration: 1.25, ease: "easeOut", delay: 0.56 }}
              />
              <div className="grid grid-cols-1 lg:min-h-104 lg:grid-cols-[0.95fr_1.85fr]">
                <motion.aside
                  className="border-b border-black/10 bg-[#f7f7f7] lg:flex lg:min-h-full lg:flex-col lg:border-b-0 lg:border-r lg:border-black/10"
                  initial={leftRailInitial}
                  animate={useCasesSceneInView ? leftRailInView : false}
                  transition={{
                    duration: 0.92,
                    delay: 0.28,
                    ease: heroSlideEase,
                  }}
                >
                  {useCaseItems.map((item, index) => {
                    const isActive = item.id === activeItem.id;
                    const Icon = item.icon;

                    return (
                      <motion.button
                        key={`${item.id}-${restartLoadSignal}`}
                        type="button"
                        onClick={() => setActiveId(item.id)}
                        className={`group relative block w-full cursor-pointer border-b border-black/10 px-4 py-3.5 text-left last:border-b-0 transition-colors duration-200 md:px-2.5 md:py-2.5 lg:flex-1 ${
                          isActive
                            ? "bg-[#fefefc] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] md:shadow-none"
                            : "bg-[#f7f7f7] hover:bg-black/2"
                        }`}
                        aria-pressed={isActive}
                        initial={{
                          opacity: 0,
                          x: -28,
                          y: 18,
                        }}
                        animate={
                          useCasesSceneInView
                            ? { opacity: 1, x: 0, y: 0 }
                            : false
                        }
                        transition={{
                          duration: 0.86,
                          delay: 0.4 + 0.1 * index,
                          ease: heroSlideEase,
                        }}
                      >
                        <span
                          className={`absolute inset-y-0 left-0 w-1 bg-[#a01717] ${
                            isActive ? "opacity-100" : "opacity-0"
                          }`}
                          aria-hidden="true"
                        />
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-black/90 md:h-3.25 md:w-3.25" />
                            <h3
                              className={`${interClassName} text-[1.1rem] font-medium tracking-[-0.01em] text-black md:text-[0.9rem]`}
                            >
                              {item.leftTitle}
                            </h3>
                          </div>
                          <ArrowRight
                            className={`h-4 w-4 transition-transform duration-200 md:h-3.25 md:w-3.25 ${
                              isActive
                                ? "translate-x-0 text-black"
                                : "text-black/55 group-hover:translate-x-0.5"
                            }`}
                          />
                        </div>
                        <p className="mt-1.25 hidden max-w-md pr-2.5 text-[0.72rem] leading-[1.2rem] text-black/58 md:block">
                          {item.leftDescription}
                        </p>
                      </motion.button>
                    );
                  })}
                </motion.aside>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${activeItem.id}-${restartLoadSignal}`}
                    className="bg-[#fefefc] px-4 py-5 sm:px-4 sm:py-4.5 lg:flex lg:h-full lg:flex-col"
                    initial={rightPanelInitial}
                    animate={rightPanelInView}
                    exit={{ opacity: 0, x: -24, y: -8 }}
                    transition={{ duration: 0.48, ease: heroSlideEase }}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.38,
                        ease: heroSlideEase,
                        delay: 0.04,
                      }}
                    >
                      <h3
                        className={`${interClassName} text-[1.36rem] leading-[1.32] font-medium tracking-[-0.02em] text-black md:text-[clamp(0.9rem,1.16vw,1.08rem)] md:leading-normal`}
                      >
                        {activeItem.rightTitle}
                      </h3>
                      <p className="mt-3.25 max-w-210 text-[0.92rem] leading-[1.66] text-black/62 md:mt-2 md:text-[clamp(0.7rem,0.8vw,0.78rem)] md:leading-[1.18rem] md:text-black/58">
                        {activeItem.rightDescription}
                      </p>
                    </motion.div>

                    <motion.div
                      className="mt-4.5 rounded-2xl bg-transparent p-0 md:mt-3.5 lg:mt-4 lg:flex-1"
                      initial={{ opacity: 0, y: 24, scale: 0.984 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        duration: 0.46,
                        ease: heroSlideEase,
                        delay: 0.08,
                      }}
                    >
                      <div className="relative flex h-56 w-full items-center justify-center overflow-hidden rounded-xl bg-[#ececec] md:h-48 lg:h-full lg:min-h-58">
                        <motion.div
                          className="pointer-events-none absolute inset-y-0 left-0 z-20 w-20 -translate-x-full bg-linear-to-r from-transparent via-white/52 to-transparent blur-sm"
                          initial={{ x: "-120%", opacity: 0 }}
                          animate={{
                            x: ["-120%", "260%"],
                            opacity: [0, 0.66, 0],
                          }}
                          transition={{
                            duration: 1.08,
                            ease: "easeOut",
                            delay: 0.16,
                          }}
                        />
                        {activeImageUrl ? (
                          <Image
                            src={activeImageUrl}
                            alt={activeItem.placeholderLabel}
                            fill
                            unoptimized
                            decoding="async"
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 72vw, 58vw"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-black/55">
                            <ImageIcon className="h-5 w-5" />
                            <p className="text-[0.68rem] tracking-[0.03em]">
                              {activeItem.placeholderLabel}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
