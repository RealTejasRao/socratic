"use client";

import { motion, type Variants, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Instrument_Serif } from "next/font/google";
import Image from "next/image";
import Script from "next/script";
import { resolveOptimizedCloudinaryPublicAsset } from "@/src/lib/cloudinary-public-assets";

type FeaturesSectionProps = {
  interClassName: string;
};

type FeatureCard = {
  id: string;
  title: string;
  description: string;
  icon: {
    src: string;
    colors: string;
    state?: string;
  };
};

const featureCards: FeatureCard[] = [
  {
    id: "argues-back",
    title: "It Argues Back.\nBy Design.",
    description:
      "Most AI tells you what you want to hear. This one is wired to push back readily.",
    icon: {
      src: "https://cdn.lordicon.com/fozsorqm.json",
      colors: "primary:#121331,secondary:#a01717",
      state: "in-reveal",
    },
  },
  {
    id: "corpus",
    title: "A Corpus Built for\nPhilosophers",
    description:
      "Responses based on original writings, not skimmed Reddit summaries.",
    icon: {
      src: "https://cdn.lordicon.com/rrbmabsx.json",
      colors: "primary:#121331,secondary:#a01717",
      state: "morph-open",
    },
  },
  {
    id: "model-of-you",
    title: "It Builds a Model,\nof You",
    description:
      "Actively tracks your beliefs and assumptions, connects them into a living model of your thinking.",
    icon: {
      src: "https://cdn.lordicon.com/vgwutnhw.json",
      colors: "primary:#121331,secondary:#a01717",
    },
  },
  {
    id: "clarity",
    title: "Clarity You Can Take\nWith You",
    description:
      "Discover positions you didn't know you held, gaps you didn't know were there.",
    icon: {
      src: "https://cdn.lordicon.com/ebvizisb.json",
      colors: "primary:#a01717,secondary:#000000",
    },
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
      className="relative -scroll-mt-10 overflow-hidden bg-transparent px-5 py-9 sm:px-7 sm:py-10 lg:h-[calc(100svh-4.25rem)] lg:min-h-160 lg:py-7"
    >
      <Script src="https://cdn.lordicon.com/lordicon.js" strategy="afterInteractive" />
      <div className="relative mx-auto flex h-full w-full max-w-544 flex-col justify-center">
        <motion.div
          className="mx-auto max-w-210 text-center"
          variants={headingVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
        >
          <h2
            className={`${instrumentSerif.className} text-[clamp(2.4rem,9.5vw,3.35rem)] font-normal leading-tight text-black sm:text-[clamp(1.62rem,4.5vw,2.7rem)] [@media(orientation:portrait)_and_(min-width:768px)_and_(max-width:1023px)]:text-[clamp(2.4rem,9.5vw,3.35rem)]`}
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
                alt="Vertical decorative divider inspired by classical architecture"
                width={412}
                height={1536}
                className="h-full w-auto"
              />
            </motion.div>
          ))}

          <div
            className="pointer-events-none absolute inset-0 z-10 hidden sm:block lg:hidden"
            aria-hidden="true"
          >
            <div className="absolute left-1/2 top-1/2 h-[88%] -translate-x-1/2 -translate-y-1/2">
              <Image
                src={resolveOptimizedCloudinaryPublicAsset("/features/separator.webp", {
                  width: 412,
                  height: 1536,
                  crop: "limit",
                  quality: "auto:good",
                })}
                alt="Vertical decorative divider inspired by classical architecture"
                width={412}
                height={1536}
                className="h-full w-auto opacity-78"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {featureCards.map((card, index) => {
              return (
                <motion.article
                  key={card.id}
                  className="bg-transparent px-5 py-8 sm:px-5 lg:min-h-58 lg:px-7 lg:py-4.5"
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.45 }}
                  custom={index}
                >
                  <div
                    className={`${index > 0 ? "lg:pl-7" : ""} sm:max-lg:w-[90%] ${
                      index % 2 === 0
                        ? "sm:max-lg:mr-auto"
                        : "sm:max-lg:ml-auto sm:max-lg:translate-x-6"
                    }`}
                  >
                    <div className="flex items-start gap-5 sm:block">
                      <div className="min-w-0">
                        <div className="h-8 w-8 sm:h-7.5 sm:w-7.5">
                          <lord-icon
                            src={card.icon.src}
                            trigger="loop"
                            delay="2000"
                            stroke="bold"
                            colors={card.icon.colors}
                            {...(card.icon.state
                              ? { state: card.icon.state }
                              : {})}
                            style={{ width: "100%", height: "100%" }}
                          />
                        </div>
                        <h3
                          className={`${interClassName} mt-6 whitespace-pre-line text-[1.35rem] leading-[1.18] tracking-normal text-black/90 sm:text-[1.1rem] sm:leading-[1.22] lg:text-[1.18rem]`}
                        >
                          {card.title}
                        </h3>
                        <p
                          className={`${interClassName} mt-10 max-w-[32ch] text-[0.92rem] leading-[1.6] text-black/66 sm:text-[0.74rem] sm:leading-[1.58]`}
                        >
                          {card.description}
                        </p>
                      </div>
                    </div>
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
