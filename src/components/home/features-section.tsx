"use client";

import { motion, type Variants, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Instrument_Serif } from "next/font/google";
import Image from "next/image";
import {
  Brain,
  MessageSquareMore,
  Route,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { resolveOptimizedCloudinaryPublicAsset } from "@/src/lib/cloudinary-public-assets";

type FeaturesSectionProps = {
  interClassName: string;
};

type FeatureCard = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const featureCards: FeatureCard[] = [
  {
    id: "argues-back",
    title: "It Argues Back.\nBy Design.",
    description:
      "Most AI tells you what you want to hear. This one is wired to push back readily.",
    icon: MessageSquareMore,
  },
  {
    id: "corpus",
    title: "A Corpus Built for\nPhilosophers",
    description:
      "Responses based on original writings, not skimmed Reddit summaries.",
    icon: Brain,
  },
  {
    id: "model-of-you",
    title: "It Builds a Model,\nof You",
    description:
      "Actively tracks your beliefs and assumptions, connects them into a living model of your thinking.",
    icon: Route,
  },
  {
    id: "clarity",
    title: "Clarity You Can Take\nWith You",
    description:
      "Discover positions you didn't know you held, gaps you didn't know were there.",
    icon: Sparkles,
  },
];

const SECTION_HEADING_TEXT = "Built Different.\nBuilt For Philosophy";
const DIFFERENT_WORD = "Different";
const PHILOSOPHY_WORD = "Philosophy";
const differentStart = SECTION_HEADING_TEXT.indexOf(DIFFERENT_WORD);
const differentEnd = differentStart + DIFFERENT_WORD.length;
const philosophyStart = SECTION_HEADING_TEXT.indexOf(PHILOSOPHY_WORD);
const philosophyEnd = philosophyStart + PHILOSOPHY_WORD.length;

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
});

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 56, scale: 0.965, rotateX: 8 },
  show: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      duration: 1.3,
      delay: 0.1 + index * 0.12,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const separatorVariants: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  show: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 1.3,
      delay: 0.16 + index * 0.12,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const separatorConfigs = [
  { position: "left-1/4", src: "/features/separator.webp" },
  { position: "left-2/4", src: "/features/separator.webp" },
  { position: "left-3/4", src: "/features/separator.webp" },
] as const;

export function FeaturesSection({ interClassName }: FeaturesSectionProps) {
  const headingRef = useRef<HTMLSpanElement | null>(null);
  const headingInView = useInView(headingRef, { once: true, amount: 0.8 });
  const [visibleHeadingChars, setVisibleHeadingChars] = useState(0);
  const [restartSignal, setRestartSignal] = useState(0);

  const typedHeading = SECTION_HEADING_TEXT.slice(0, visibleHeadingChars);
  const typedDifferentStart = Math.min(typedHeading.length, differentStart);
  const typedDifferentEnd = Math.min(typedHeading.length, differentEnd);
  const typedPhilosophyStart = Math.min(typedHeading.length, philosophyStart);
  const typedPhilosophyEnd = Math.min(typedHeading.length, philosophyEnd);
  const typedHeadingBeforeDifferent = typedHeading.slice(0, typedDifferentStart);
  const typedHeadingDifferent = typedHeading.slice(
    typedDifferentStart,
    typedDifferentEnd,
  );
  const typedHeadingBetweenHighlights = typedHeading.slice(
    typedDifferentEnd,
    typedPhilosophyStart,
  );
  const typedHeadingPhilosophy = typedHeading.slice(
    typedPhilosophyStart,
    typedPhilosophyEnd,
  );
  const typedHeadingAfterPhilosophy = typedHeading.slice(typedPhilosophyEnd);

  useEffect(() => {
    const onRestart = (event: Event) => {
      const customEvent = event as CustomEvent<{ sectionId?: string }>;
      if (customEvent.detail?.sectionId !== "features") return;
      setVisibleHeadingChars(0);
      setRestartSignal((count) => count + 1);
    };

    window.addEventListener("section:typewriter:restart", onRestart);
    return () =>
      window.removeEventListener("section:typewriter:restart", onRestart);
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
      className="relative -scroll-mt-10 overflow-hidden bg-transparent px-5 py-9 sm:px-7 sm:py-10 lg:h-[calc(100svh-4.25rem)] lg:min-h-[40rem] lg:py-7"
    >
      <div className="relative mx-auto flex h-full w-full max-w-[136rem] flex-col justify-center">
        <motion.div
          className="mx-auto max-w-210 text-center"
          variants={headingVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
        >
          <h2
            className={`${instrumentSerif.className} text-[clamp(1.62rem,4.5vw,2.7rem)] font-normal leading-tight text-black`}
          >
            <span ref={headingRef} className="inline-grid align-top">
              <span
                className="col-start-1 row-start-1 invisible whitespace-pre-line"
                aria-hidden="true"
              >
                {SECTION_HEADING_TEXT}
              </span>
              <span className="col-start-1 row-start-1 whitespace-pre-line">
                {typedHeadingBeforeDifferent}
                <span className="text-[#a01717]">{typedHeadingDifferent}</span>
                {typedHeadingBetweenHighlights}
                <span className="text-[#a01717]">{typedHeadingPhilosophy}</span>
                {typedHeadingAfterPhilosophy}
                <span className="hero-caret" aria-hidden="true" />
              </span>
            </span>
          </h2>
        </motion.div>

        <div className="relative mt-7 translate-y-3 lg:translate-y-5">
          {separatorConfigs.map(({ position, src }, index) => (
            <motion.div
              key={position}
              className={`pointer-events-none absolute top-1/2 z-10 hidden h-[88%] -translate-x-1/2 -translate-y-1/2 ${position} lg:block`}
              variants={separatorVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.55 }}
              custom={index}
            >
              <Image
                src={resolveOptimizedCloudinaryPublicAsset(src, {
                  width: 412,
                  height: 1536,
                  crop: "limit",
                  quality: "auto:good",
                })}
                alt=""
                aria-hidden="true"
                width={412}
                height={1536}
                className="h-full w-auto"
              />
            </motion.div>
          ))}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {featureCards.map((card, index) => {
              const Icon = card.icon;

              return (
                <motion.article
                  key={card.id}
                  className="bg-transparent px-5 py-8 lg:min-h-[14.5rem] lg:px-7 lg:py-4.5"
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.45 }}
                  custom={index}
                >
                  <div className={index > 0 ? "lg:pl-7" : undefined}>
                    <Icon className="h-[22px] w-[22px] text-black/85" />
                    <h3
                      className={`${interClassName} mt-6 whitespace-pre-line text-[1rem] leading-[1.22] tracking-normal text-black/90 sm:text-[1.1rem] lg:text-[1.18rem]`}
                    >
                      {card.title}
                    </h3>
                    <p
                      className={`${interClassName} mt-10 max-w-[32ch] text-[0.74rem] leading-[1.58] text-black/66`}
                    >
                      {card.description}
                    </p>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
