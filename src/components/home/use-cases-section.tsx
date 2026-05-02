"use client";

import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
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
    imageSrc: "/media/useCasesSection/image1.jpg",
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
    imageSrc: "/media/useCasesSection/image2.jpg",
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
    imageSrc: "/media/useCasesSection/image3.jpg",
  },
];

const USE_CASES_HEADING_TEXT = "One AI, Endless Directions";

export function UseCasesSection({ interClassName }: UseCasesSectionProps) {
  const headingRef = useRef<HTMLSpanElement | null>(null);
  const headingInView = useInView(headingRef, { once: true, amount: 0.8 });
  const [activeId, setActiveId] = useState(useCaseItems[0]?.id ?? "");
  const [visibleHeadingChars, setVisibleHeadingChars] = useState(0);
  const [restartHeadingSignal, setRestartHeadingSignal] = useState(0);
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

  return (
    <motion.section
      id="use-cases"
      className="relative scroll-mt-10 bg-[#fefefc] px-6 py-7 sm:px-8 sm:py-8 lg:py-9"
      initial={{ opacity: 0, y: 26, filter: "blur(9px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.68, ease: "easeOut" }}
    >
      <motion.div
        className="mx-auto w-full max-w-250"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.62, delay: 0.08, ease: "easeOut" }}
      >
        <div className="mb-4 text-center sm:mb-5">
          <h2
            className={`${interClassName} text-[clamp(1.2rem,2.6vw,2.2rem)] font-medium leading-tight text-black`}
          >
            <span ref={headingRef} className="inline-grid align-top">
              <span
                className="col-start-1 row-start-1 invisible"
                aria-hidden="true"
              >
                {USE_CASES_HEADING_TEXT}
              </span>
              <span className="col-start-1 row-start-1">
                {typedHeading}
                <span className="hero-caret" aria-hidden="true" />
              </span>
            </span>
          </h2>
          <p className="mx-auto mt-8 flex max-w-180 items-center justify-center gap-2 text-[clamp(0.72rem,0.95vw,0.9rem)] leading-[1.6] text-black/62">
            <span
              className="relative inline-flex h-2 w-2 items-center justify-center"
              aria-hidden="true"
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500/55" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
            </span>
            <span>
              Every session goes exactly where your curiosity takes it.
            </span>
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-black/25 outline-1 -outline-offset-1 outline-black/12 bg-[#fefefc] md:mt-5">
          <div className="grid grid-cols-1 lg:min-h-96 lg:grid-cols-[0.95fr_1.85fr]">
            <aside className="border-b border-black/10 bg-[#f7f7f7] lg:flex lg:min-h-full lg:flex-col lg:border-b-0 lg:border-r lg:border-black/10">
              {useCaseItems.map((item, index) => {
                const isActive = item.id === activeItem.id;
                const Icon = item.icon;

                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveId(item.id)}
                    className={`group relative block w-full cursor-pointer border-b border-black/10 px-3 py-3 text-left last:border-b-0 transition-colors duration-200 lg:flex-1 ${
                      isActive
                        ? "bg-[#fefefc]"
                        : "bg-[#f7f7f7] hover:bg-black/2"
                    }`}
                    aria-pressed={isActive}
                    initial={{ opacity: 0, x: -18 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.55 }}
                    transition={{
                      duration: 0.45,
                      delay: 0.06 * index,
                      ease: "easeOut",
                    }}
                  >
                    <span
                      className={`absolute inset-y-0 left-0 w-1 bg-black ${
                        isActive ? "opacity-100" : "opacity-0"
                      }`}
                      aria-hidden="true"
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-3.5 w-3.5 text-black/90" />
                        <h3
                          className={`${interClassName} text-[0.76rem] font-medium tracking-[-0.01em] text-black`}
                        >
                          {item.leftTitle}
                        </h3>
                      </div>
                      <ArrowRight
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          isActive
                            ? "translate-x-0 text-black"
                            : "text-black/55 group-hover:translate-x-0.5"
                        }`}
                      />
                    </div>
                    <p className="mt-1.5 max-w-md pr-3 text-[0.72rem] leading-5 text-black/58">
                      {item.leftDescription}
                    </p>
                  </motion.button>
                );
              })}
            </aside>

            <motion.div
              key={activeItem.id}
              className="bg-[#fefefc] px-3 py-4.5 sm:px-4 sm:py-5.5 lg:flex lg:h-full lg:flex-col"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.36, ease: "easeOut" }}
            >
              <h3
                className={`${interClassName} text-[clamp(0.86rem,1.15vw,1.05rem)] font-medium tracking-[-0.02em] text-black`}
              >
                {activeItem.rightTitle}
              </h3>
              <p className="mt-2.5 max-w-210 text-[clamp(0.68rem,0.8vw,0.76rem)] leading-5 text-black/58">
                {activeItem.rightDescription}
              </p>

              <div className="mt-4 rounded-2xl bg-transparent p-0 lg:mt-4.5 lg:flex-1">
                <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-xl bg-[#ececec] sm:h-41 lg:h-full lg:min-h-51">
                  {activeImageUrl ? (
                    <Image
                      src={activeImageUrl}
                      alt={activeItem.placeholderLabel}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 72vw, 58vw"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-black/55">
                      <ImageIcon className="h-6 w-6" />
                      <p className="text-[0.73rem] tracking-[0.03em]">
                        {activeItem.placeholderLabel}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
