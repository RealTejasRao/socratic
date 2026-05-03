"use client";

import Image from "next/image";
import { motion, type Variants, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Instrument_Serif } from "next/font/google";
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  MessageSquareMore,
  Route,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

type FeaturesSectionProps = {
  interClassName: string;
};

type FeatureSlide = {
  id: string;
  title: string;
  description: string;
  textureSrc: string;
  icon: LucideIcon;
};

const featureSlides: FeatureSlide[] = [
  {
    id: "argues-back",
    title: "It Argues Back.\nBy Design.",
    description:
      "Most AI tells you what you want to hear. This one is wired to push back readily.",
    textureSrc: "/features/block1.png",
    icon: MessageSquareMore,
  },
  {
    id: "corpus",
    title: "A Corpus Built for\nPhilosophers",
    description:
      "Responses based on original writings, not skimmed Reddit summaries.",
    textureSrc: "/features/block2.png",
    icon: Brain,
  },
  {
    id: "model-of-you",
    title: "It Builds a Model,\nof You",
    description:
      "Actively tracks your beliefs and assumptions, connects them into a living model of your thinking.",
    textureSrc: "/features/block3.png",
    icon: Route,
  },
  {
    id: "clarity",
    title: "Clarity You Can Take\nWith You",
    description:
      "Discover positions you didn't know you held, gaps you didn't know were there.",
    textureSrc: "/features/block6.png",
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

const leftPillarVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -72,
    y: 120,
    rotate: -8,
    scale: 0.92,
  },
  show: {
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    transition: { duration: 1.35, ease: [0.22, 1, 0.36, 1] },
  },
};

const rightPillarVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 72,
    y: 120,
    rotate: 8,
    scale: 0.92,
  },
  show: {
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    transition: { duration: 1.35, ease: [0.22, 1, 0.36, 1] },
  },
};

const carouselShellVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 54,
    scale: 0.94,
    rotateX: 10,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: { duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.2 },
  },
};

export function FeaturesSection({ interClassName }: FeaturesSectionProps) {
  const headingRef = useRef<HTMLSpanElement | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const headingInView = useInView(headingRef, { once: true, amount: 0.8 });
  const carouselInView = useInView(carouselRef, { once: true, amount: 0.35 });
  const [visibleHeadingChars, setVisibleHeadingChars] = useState(0);
  const [restartSignal, setRestartSignal] = useState(0);
  const [restartLoadSignal, setRestartLoadSignal] = useState(0);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [animatedOptions, setAnimatedOptions] = useState<number[]>([]);

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
      setRestartLoadSignal((count) => count + 1);
      setActiveFeatureIndex(0);
      setAnimatedOptions([]);
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
      setRestartLoadSignal((count) => count + 1);
      setActiveFeatureIndex(0);
      setAnimatedOptions([]);
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

  useEffect(() => {
    if (!carouselInView) return;

    const timers = featureSlides.map((_, index) =>
      window.setTimeout(() => {
        setAnimatedOptions((prev) => [...prev, index]);
      }, 230 * index),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [carouselInView, restartLoadSignal]);

  useEffect(() => {
    const autoAdvance = window.setTimeout(() => {
      setActiveFeatureIndex((current) => (current + 1) % featureSlides.length);
    }, 6000);

    return () => window.clearTimeout(autoAdvance);
  }, [activeFeatureIndex]);

  const goToPreviousFeature = () => {
    setActiveFeatureIndex((current) =>
      current === 0 ? featureSlides.length - 1 : current - 1,
    );
  };

  const goToNextFeature = () => {
    setActiveFeatureIndex((current) => (current + 1) % featureSlides.length);
  };

  return (
    <section
      id="features"
      className="relative -scroll-mt-10 overflow-hidden bg-transparent px-5 py-10 sm:px-8 sm:py-12 lg:h-[calc(100svh-4.25rem)] lg:min-h-[44rem] lg:py-8"
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
              key={`features-left-pillar-${restartLoadSignal}`}
              className="pointer-events-none hidden lg:block"
              variants={leftPillarVariants}
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

            <motion.div
              key={`features-carousel-${restartLoadSignal}`}
              ref={carouselRef}
              className="relative overflow-visible rounded-xl bg-transparent p-0"
              style={{ perspective: 1200 }}
              variants={carouselShellVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
            >
              <motion.div
                className="pointer-events-none absolute inset-y-0 left-0 z-30 w-24 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent blur-md"
                initial={{ x: "-120%", opacity: 0 }}
                animate={
                  carouselInView
                    ? { x: ["-120%", "260%"], opacity: [0, 0.7, 0] }
                    : false
                }
                transition={{ duration: 1.35, ease: "easeOut", delay: 0.58 }}
              />
              <button
                type="button"
                onClick={goToPreviousFeature}
                className="absolute -left-8 top-1/2 z-20 -translate-y-1/2 p-0 text-black/65 transition hover:text-black"
                aria-label="Previous feature"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goToNextFeature}
                className="absolute -right-8 top-1/2 z-20 -translate-y-1/2 p-0 text-black/65 transition hover:text-black"
                aria-label="Next feature"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="flex h-[16.5rem] w-full min-w-0 items-stretch overflow-hidden rounded-lg sm:h-[19rem] lg:h-[23rem]">
                {featureSlides.map((slide, index) => {
                  const isActive = activeFeatureIndex === index;
                  const isAnimated = animatedOptions.includes(index);
                  const Icon = slide.icon;

                  return (
                    <motion.button
                      key={slide.id}
                      type="button"
                      onClick={() => setActiveFeatureIndex(index)}
                      className="group relative m-0 flex min-w-[3.9rem] flex-[1_1_0%] cursor-pointer flex-col justify-end overflow-hidden text-left"
                      animate={{
                        flexGrow: isActive ? 7 : 1,
                        opacity: isAnimated ? 1 : 0,
                        x: isAnimated ? 0 : index % 2 === 0 ? -64 : 64,
                        y: isAnimated ? 0 : 38,
                        scale: isAnimated ? 1 : 0.88,
                        rotate: isAnimated ? 0 : index % 2 === 0 ? -4 : 4,
                      }}
                      transition={{
                        duration: 0.78,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      aria-pressed={isActive}
                    >
                      <Image
                        src={slide.textureSrc}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 25vw, 19vw"
                      />

                      <div className="absolute inset-0 bg-black/24 transition-colors duration-500 group-hover:bg-black/20" />

                      <div className="absolute inset-0 z-10 flex items-center justify-center px-4 text-center sm:px-6">
                        <div className="text-white">
                          <div
                            className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center transition-all duration-700 ${
                              isActive
                                ? "translate-y-0 opacity-100"
                                : "translate-y-2 opacity-0"
                            }`}
                          >
                            <Icon className="h-7 w-7 text-white/96" />
                          </div>
                          <p
                            className={`${interClassName} whitespace-pre-line text-[1.08rem] font-medium leading-[1.22] transition-all duration-700 sm:text-[1.34rem] ${
                              isActive
                                ? "translate-x-0 opacity-100"
                                : "translate-x-4 opacity-0"
                            }`}
                          >
                            {slide.title}
                          </p>
                          <p
                            className={`${interClassName} mx-auto mt-6 max-w-[38ch] text-[0.76rem] leading-5 text-white/90 transition-all duration-700 sm:text-[0.84rem] ${
                              isActive
                                ? "translate-x-0 opacity-100"
                                : "translate-x-4 opacity-0"
                            }`}
                          >
                            {slide.description}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              key={`features-right-pillar-${restartLoadSignal}`}
              className="pointer-events-none hidden lg:block"
              variants={rightPillarVariants}
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
