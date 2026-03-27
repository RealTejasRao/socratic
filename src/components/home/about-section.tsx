"use client";

import { motion, type Variants, useInView } from "framer-motion";
import { Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type AboutSectionProps = {
  interClassName: string;
};

const ABOUT_PARAGRAPHS = [
  "I've always had too many questions. About why things are the way they are. Why this, why that. I would sit with my notebook and a pen and think on a topic that was mundane for most. I never really got the full answers, you're not supposed to. Confusion and Confusion.  I thought that reading philosophy would give me the answers I wanted, that it would clear the fog. Well as you can guess, it didn't. It deepened it. The fog was thicker, stranger, but now it was surely more interesting. And I stopped wanting the fog to clear. Began to love it, live it. Uncertainty became my home, and that's the best way to live, and I suppose a human must die uncertain, as if he claims he has the answers, he has stopped thinking at some point.",
  "I was pretty content with myself, but I always wished that I just need one person, one damn person in this world who I can talk to about what's going in my head, what do they think of it, and have a nice deep discussion about it. The thing I realized that most people can't do that today. Whenever I touched something 'uncomfortable', they get defensive. This thing, it infuriates me the most. People defending opinions with their life that aren't really theirs.",
  "I turned to AI, bots most people use these days. But I just didn't feel that click. They are too agreeable, too smooth, and the way they freaking talk annoys me. I decided to build one myself, for myself.",
  "Now I'm not one of the best programmers, but I'll say I'm decent. I tried it, tweaked it again and again. And the best decision I made was to put a debate mode into it. It was now too blunt, too ruthless, and I knew that this is what I wanted. One thing I will say, even if you are not preparing for a debate, try the debate mode. It will lay your thoughts bare in front of you.",
  "This AI was never really planned to be launched like this. I made this for myself. But after using it I just thought if I needed this, that there has to be someone on this planet who probably does too. Plus it was a chance to brush up my programming skills. (Programming isn't my major, I just do it for fun).",
  "A little more about me, I'm 19. History nerd (specifically Italian history),  again, not my major. I have also noticed that most AI models get historical details embarrassingly wrong and are pretty horrible at it overall. If this Socratic AI works, I'll probably add a history specialized bot too in this, that's actually good.",
  "Thanks for reading, people rarely read the About section.",
  "In the end, Just remember this wherever you are and whoever you are. Think more. Think deeper. Think until it hurts, and then think a little more. You'll be unambiguously better off.",
];

const SHOOTING_STARS = [
  { top: "8%", left: "6%", delay: 0.2, duration: 2.8 },
  { top: "16%", left: "38%", delay: 1.3, duration: 3.2 },
  { top: "22%", left: "68%", delay: 2.1, duration: 3.5 },
  { top: "46%", left: "12%", delay: 0.9, duration: 3.1 },
  { top: "58%", left: "55%", delay: 2.6, duration: 2.9 },
  { top: "74%", left: "28%", delay: 1.8, duration: 3.4 },
];

const ABOUT_HEADING_TEXT = "Read this if you got 2 minutes";

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(7px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] },
  },
};

const textListVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const textItemVariants: Variants = {
  hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  },
};

export function AboutSection({ interClassName }: AboutSectionProps) {
  const headingRef = useRef<HTMLSpanElement | null>(null);
  const headingInView = useInView(headingRef, { once: true, amount: 0.8 });
  const [visibleHeadingChars, setVisibleHeadingChars] = useState(0);
  const [restartSignal, setRestartSignal] = useState(0);
  const typedHeading = ABOUT_HEADING_TEXT.slice(0, visibleHeadingChars);

  useEffect(() => {
    const onRestart = (event: Event) => {
      const customEvent = event as CustomEvent<{ sectionId?: string }>;
      if (customEvent.detail?.sectionId !== "about") return;
      setVisibleHeadingChars(0);
      setRestartSignal((count) => count + 1);
    };

    window.addEventListener("section:typewriter:restart", onRestart);
    return () =>
      window.removeEventListener("section:typewriter:restart", onRestart);
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash !== "#about") return;
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
        if (count >= ABOUT_HEADING_TEXT.length) {
          window.clearInterval(interval);
          return count;
        }
        return count + 1;
      });
    }, 46);

    return () => window.clearInterval(interval);
  }, [headingInView, restartSignal]);

  return (
    <motion.section
      id="about"
      className="relative min-h-screen scroll-mt-3 bg-white px-6 py-12 sm:px-8 sm:py-14 lg:py-16"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.12 }}
      variants={revealVariants}
    >
      <div className="mx-auto w-full max-w-330">
        <motion.div className="text-center" variants={revealVariants}>
          <h2
            className={`${interClassName} text-[clamp(1.2rem,2.6vw,2.2rem)] font-medium leading-tight text-black`}
          >
            <span ref={headingRef} className="inline-grid align-top">
              <span
                className="col-start-1 row-start-1 invisible"
                aria-hidden="true"
              >
                {ABOUT_HEADING_TEXT}
              </span>
              <span className="col-start-1 row-start-1">
                {typedHeading}
                <span className="hero-caret" aria-hidden="true" />
              </span>
            </span>
          </h2>
          <motion.p
            variants={revealVariants}
            className="mx-auto mt-8 inline-flex max-w-180 items-center gap-2 text-[clamp(0.74rem,0.95vw,0.88rem)] leading-[1.6] text-black/62"
          >
            <span
              className="relative inline-flex h-2.5 w-2.5 items-center justify-center"
              aria-hidden="true"
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-500/55" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-purple-500" />
            </span>
            <span>A honest story about why this exists</span>
          </motion.p>
        </motion.div>

        <motion.div
          className="mt-12 md:mt-14"
          variants={revealVariants}
        >
          <article className="relative overflow-hidden border border-white/12 bg-[#0b0f18] px-5 py-5 sm:px-6 sm:py-6">
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              {SHOOTING_STARS.map((star, index) => (
                <motion.span
                  key={`${star.top}-${star.left}-${index}`}
                  className="absolute h-px w-16 rotate-23 bg-linear-to-r from-transparent via-white/85 to-transparent"
                  style={{ top: star.top, left: star.left }}
                  animate={{
                    x: [0, 120],
                    y: [0, 46],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: star.duration,
                    delay: star.delay,
                    repeat: Infinity,
                    repeatDelay: 2.4 + index * 0.18,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            <motion.div
              className="relative mx-auto max-w-none space-y-3 text-[0.74rem] leading-5.4 tracking-[0.003em] text-white/84 sm:text-[0.78rem] sm:leading-5.7"
              variants={textListVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
            >
              <motion.div
                className="inline-flex items-center gap-2 text-white/88"
                variants={textItemVariants}
              >
                <Smile className="h-4 w-4" />
              </motion.div>
              {ABOUT_PARAGRAPHS.map((paragraph) => (
                <motion.p key={paragraph} variants={textItemVariants}>
                  {paragraph}
                </motion.p>
              ))}
            </motion.div>
          </article>
        </motion.div>
      </div>
    </motion.section>
  );
}
