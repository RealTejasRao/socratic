"use client";

import Image from "next/image";
import { motion, type Variants, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Instrument_Serif } from "next/font/google";

type FeaturesSectionProps = {
  interClassName: string;
};

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
  hidden: { opacity: 0, y: 26, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const pillarsVariants: Variants = {
  hidden: { opacity: 0, y: 36, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
  },
};

export function FeaturesSection({ interClassName: _interClassName }: FeaturesSectionProps) {
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
      className="relative scroll-mt-1 overflow-hidden bg-[#fefefc] px-5 py-10 sm:px-8 sm:py-12 lg:h-[calc(100svh-4.25rem)] lg:min-h-[44rem] lg:py-8"
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
            className={`${instrumentSerif.className} text-[clamp(1.8rem,5vw,3rem)] font-normal leading-tight text-black`}
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

        <div className="mt-7 lg:mt-8">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(8rem,12rem)_1fr_minmax(8rem,12rem)] lg:gap-6">
            <motion.div
              className="pointer-events-none hidden lg:block"
              variants={pillarsVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
            >
              <div className="relative h-[28rem] w-full lg:-mt-24">
                <Image
                  src="/features/pillarForLeft.png"
                  alt="Left decorative pillar"
                  fill
                  priority={false}
                  className="object-contain object-top"
                  sizes="15rem"
                />
              </div>
            </motion.div>

            <div />

            <motion.div
              className="pointer-events-none hidden lg:block"
              variants={pillarsVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
            >
              <div className="relative h-[28rem] w-full lg:-mt-24">
                <Image
                  src="/features/pillarForRight.png"
                  alt="Right decorative pillar"
                  fill
                  priority={false}
                  className="object-contain object-top"
                  sizes="15rem"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
