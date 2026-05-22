"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { useEffect, useMemo, useRef, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  Compass,
  Globe,
  MessageCircle,
  MessagesSquare,
  ScrollText,
  SlidersHorizontal,
  Sparkles,
  Swords,
} from "lucide-react";
import { PremiumCrownIcon } from "@/src/components/billingsdk/premium-crown-icon";
import { resolveOptimizedCloudinaryPublicAsset } from "@/src/lib/cloudinary-public-assets";
import { getDailyIndex } from "@/src/lib/twa-daily";
import { ROUTES } from "@/src/lib/routes";
import type { SessionMode } from "@/src/types/chat";

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400" });

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

type DailyThoughtEntry = {
  quote: string;
  philosopher: string;
};

type LatestSessionSummary = {
  id: string;
  mode: SessionMode;
  title: string | null;
  firstUserMessage: string | null;
};

type BlogPreview = {
  slug: string;
  title: string;
  category: string;
  readTimeLabel: string;
  coverImagePath: string;
};

type TwaHomeShellProps = {
  isSignedIn: boolean;
  isPremium: boolean;
  latestSession: LatestSessionSummary | null;
  blogPosts: BlogPreview[];
  thoughts: DailyThoughtEntry[];
  topics: string[];
  todayThought: DailyThoughtEntry | null;
  todayTopic: string | null;
};

const SOCRATIC_TONE_KEY = "socratic:settings:socraticTone";

const INTRO_CARDS = [
  {
    id: "01",
    title: "Ask anything. Think deeper.",
    body: "Socratic AI guides you with questions that unlock clarity and understanding.",
    image: "/twa/intro/card1.webp",
    icon: MessagesSquare,
  },
  {
    id: "02",
    title: "Challenge your own certainty.",
    body: "Debate Mode pressure-tests your argument and reveals weak assumptions fast.",
    image: "/twa/intro/card2.webp",
    icon: Swords,
  },
  {
    id: "03",
    title: "Think with history's sharpest minds.",
    body: "Roleplay Mode lets you converse with philosophers in their own tradition.",
    image: "/twa/intro/card3.webp",
    icon: ScrollText,
  },
  {
    id: "04",
    title: "Pick the voice you need today.",
    body: "Choose supportive, clear, or ruthless pressure depending on your goal.",
    image: "/twa/intro/card4.webp",
    icon: SlidersHorizontal,
  },
] as const;

const TONE_OPTIONS = [
  {
    value: "SIMPLE_CLEAR",
    label: "Simple and Clear",
    subtitle: "Direct, plain, and easy to follow.",
  },
  {
    value: "RUTHLESS_BLUNT",
    label: "Ruthless and Blunt",
    subtitle: "Hard challenge with zero softness.",
  },
  {
    value: "BALANCED",
    label: "Encouraging and Supportive",
    subtitle: "Constructive pressure without hostility.",
  },
] as const;

type ToneValue = (typeof TONE_OPTIONS)[number]["value"];
const ABOUT_BLOG_HREF = "/blog/what-is-socratic-ai" as Route;

function truncatePreview(value: string | null, max = 80) {
  if (!value) {
    return "Continue your last line of thinking.";
  }

  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) {
    return trimmed;
  }

  return `${trimmed.slice(0, max - 1).trimEnd()}...`;
}

function modeLabel(mode: SessionMode) {
  if (mode === "DEBATE") return "Debate Mode";
  if (mode === "ROLEPLAY") return "Roleplay Mode";
  return "Socratic Chat";
}

function ModeIcon({ mode }: { mode: SessionMode }) {
  if (mode === "DEBATE") {
    return <Swords size={34} className="text-[#e24b4b]" />;
  }

  if (mode === "ROLEPLAY") {
    return <ScrollText size={34} className="text-[#d2a33b]" />;
  }

  return <MessageCircle size={34} className="text-[#ff6464]" />;
}

function IntroScreen() {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % INTRO_CARDS.length);
    }, 3800);

    return () => {
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const activeCard = cardRefs.current[activeIndex];
    if (!activeCard) {
      return;
    }

    activeCard.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
  }, [activeIndex]);

  const syncActiveSlideToScroll = () => {
    const slider = sliderRef.current;
    if (!slider) {
      return;
    }

    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cardRefs.current.forEach((card, index) => {
      if (!card) {
        return;
      }

      const distance = Math.abs(card.offsetLeft - slider.scrollLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex((current) => (current === closestIndex ? current : closestIndex));
  };

  return (
    <div className="pwa-standalone-only">
      <main className={`relative h-[100svh] overflow-hidden bg-black text-white ${inter.className}`}>
        <section className="relative z-10 h-full px-4 pt-[calc(0.7rem+env(safe-area-inset-top))]">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between">
              <Image
                src="/brand/Logo_Light_SVG.svg"
                alt="Socratic AI"
                width={34}
                height={34}
                className="h-[2.125rem] w-[2.125rem] opacity-95"
                priority
              />
              <Link
                href={ABOUT_BLOG_HREF}
                className="inline-flex items-center gap-1 text-[0.86rem] text-white/82 transition hover:text-white"
              >
                Learn more
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="mt-3 min-h-0 flex-1 overflow-y-auto pb-[15.4rem]">
              <div className="relative min-h-52">
                <div className="relative z-10 max-w-[12.25rem] pt-2">
                  <h1
                    className={`${instrumentSerif.className} text-[2.35rem] leading-[0.92] tracking-[-0.025em]`}
                  >
                    Socratic AI
                  </h1>
                  <p
                    className={`${instrumentSerif.className} mt-1.5 text-[1.02rem] leading-[1.16] tracking-[-0.005em]`}
                  >
                    Sharpen your <span className="text-[#d44b51]">thinking.</span>
                  </p>
                  <p className="mt-2.5 max-w-48 text-[0.84rem] leading-[1.62] text-white/62">
                    Your AI companion for deeper conversations, debates, and
                    timeless wisdom.
                  </p>
                </div>

                <div className="pointer-events-none absolute inset-y-0 right-0 w-[58%]">
                  <Image
                    src={resolveOptimizedCloudinaryPublicAsset(
                      "/twa/intro/socrates2.webp",
                      { width: 920, crop: "fill", quality: "auto:good" },
                    )}
                    alt="Socrates statue"
                    fill
                    sizes="52vw"
                    className="object-contain object-right-top"
                    priority
                  />
                  <div className="absolute inset-0 bg-black/38" />
                </div>
              </div>

              <div
                ref={sliderRef}
                onScroll={syncActiveSlideToScroll}
                className="mt-2 flex snap-x snap-mandatory gap-3 overflow-x-auto pr-2"
              >
                <div
                  className="contents"
                >
                  {INTRO_CARDS.map((card) => {
                    const Icon = card.icon;
                    return (
                      <article
                        key={card.id}
                        ref={(element) => {
                          cardRefs.current[Number(card.id) - 1] = element;
                        }}
                        className="relative min-h-[24.25rem] w-[72%] shrink-0 snap-start overflow-hidden rounded-3xl border border-white/20 bg-black"
                      >
                        <div className="pointer-events-none absolute -right-[5%] top-0 h-[56%] w-[72%]">
                          <Image
                            src={resolveOptimizedCloudinaryPublicAsset(card.image, {
                              width: 960,
                              crop: "fill",
                              quality: "auto:good",
                            })}
                            alt={card.title}
                            fill
                            sizes="80vw"
                            className="object-cover object-top opacity-[0.3]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-l from-black/22 via-black/60 to-black" />
                          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/67 to-black" />
                        </div>

                        <div className="relative z-10 flex h-full flex-col p-[1.125rem]">
                          <span className="text-[0.78rem] tracking-[0.08em] text-[#d84545]">
                            {card.id}
                          </span>
                          <div className="mt-5 inline-flex h-[2.625rem] w-[2.625rem] items-center justify-center rounded-full bg-[#8c1a22]/30 text-[#ff5a5a]">
                            <Icon size={20} />
                          </div>
                          <h3
                            className={`${instrumentSerif.className} mt-5 max-w-[10.8rem] text-[1.04rem] leading-[1.24] tracking-[-0.004em] text-white/95`}
                          >
                            {card.title}
                          </h3>
                          <h2 className="mt-4 max-w-[10.9rem] text-[0.76rem] leading-[1.66] text-white/60">
                            {card.body}
                          </h2>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-center gap-2">
                {INTRO_CARDS.map((card, index) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      setActiveIndex(index);
                      const targetCard = cardRefs.current[index];
                      targetCard?.scrollIntoView({
                        behavior: "smooth",
                        inline: "start",
                        block: "nearest",
                      });
                    }}
                    aria-label={`Go to slide ${index + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      index === activeIndex ? "w-5 bg-[#df434d]" : "w-2 bg-white/28"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="absolute inset-x-4 bottom-[calc(0.72rem+env(safe-area-inset-bottom))] z-30 space-y-2">
          <a
            href={ROUTES.SIGN_UP}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-[#b63038] bg-[linear-gradient(118deg,#871a21_0%,#b72d36_56%,#9d212a_100%)] text-[0.98rem] font-medium text-white"
          >
            Create Account
          </a>
          <a
            href={ROUTES.SIGN_IN}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/16 bg-transparent text-[0.98rem] font-medium text-white/92"
          >
            Log In
          </a>
          <p className="pt-0.5 text-center text-[0.72rem] leading-relaxed text-white/48">
            By continuing, you agree to our{" "}
            <a href={ROUTES.TERMS} className="text-[#d24a4a]">
              Terms
            </a>{" "}
            and{" "}
            <a href={ROUTES.PRIVACY_POLICY_ALIAS} className="text-[#d24a4a]">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}

function DashboardScreen({
  isPremium,
  latestSession,
  blogPosts,
  thoughts,
  topics,
  todayThought,
  todayTopic,
}: Omit<TwaHomeShellProps, "isSignedIn">) {
  const router = useRouter();
  const [selectedTone, setSelectedTone] = useState<ToneValue>(() => {
    if (typeof window === "undefined") {
      return "SIMPLE_CLEAR";
    }

    try {
      const stored = localStorage.getItem(SOCRATIC_TONE_KEY);
      if (
        stored === "SIMPLE_CLEAR" ||
        stored === "RUTHLESS_BLUNT" ||
        stored === "BALANCED"
      ) {
        return stored;
      }
    } catch {
      // ignore
    }

    return "SIMPLE_CLEAR";
  });
  const [showToneModal, setShowToneModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeThought, setActiveThought] = useState<DailyThoughtEntry | null>(
    todayThought,
  );
  const [activeTopic, setActiveTopic] = useState<string | null>(todayTopic);

  useEffect(() => {
    const refreshDaily = () => {
      const now = new Date();

      if (thoughts.length > 0) {
        setActiveThought(thoughts[getDailyIndex(now, thoughts.length)] ?? null);
      }
      if (topics.length > 0) {
        setActiveTopic(topics[getDailyIndex(now, topics.length)] ?? null);
      }
    };

    const scheduleNextRefresh = () => {
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        1,
      );
      return window.setTimeout(() => {
        refreshDaily();
        timeoutId = scheduleNextRefresh();
      }, nextMidnight.getTime() - now.getTime());
    };

    let timeoutId = scheduleNextRefresh();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshDaily();
      }
    };

    window.addEventListener("focus", refreshDaily);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("focus", refreshDaily);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [thoughts, topics]);

  const toneLabel = useMemo(
    () =>
      TONE_OPTIONS.find((tone) => tone.value === selectedTone)?.label ??
      "Simple and Clear",
    [selectedTone],
  );

  const openMode = (mode: "socratic" | "debate" | "roleplay") => {
    if (mode === "debate" && !isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    router.push(`/app?mode=${mode}`);
  };

  const startDailyTopic = () => {
    if (!activeTopic) {
      return;
    }
    router.push(
      `/app?mode=socratic&autosend=1&topic=${encodeURIComponent(activeTopic)}`,
    );
  };

  const chooseTone = (tone: ToneValue) => {
    if (tone === "RUTHLESS_BLUNT" && !isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    setSelectedTone(tone);
    try {
      localStorage.setItem(SOCRATIC_TONE_KEY, tone);
    } catch {
      // ignore
    }
    setShowToneModal(false);
  };

  return (
    <div className="pwa-standalone-only">
      <main className="min-h-svh bg-[#020305] text-[#f2f0eb]">
      <section className="mx-auto w-full max-w-115 px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-[calc(0.95rem+env(safe-area-inset-top))]">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[3.2rem] leading-[0.88] tracking-[-0.04em] font-[Georgia,serif]">
              Socratic AI
            </h1>
            <p className="mt-1 text-[2rem] leading-none tracking-[-0.03em] text-[#8f8f93]">
              Think Better.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={isPremium ? ROUTES.APP_BILLING : ROUTES.PRICING}
              className="inline-flex h-11 items-center gap-1.5 rounded-full border border-[#43351f] bg-[#120d06] px-3.5 text-[0.94rem] text-[#e0bb57]"
            >
              <PremiumCrownIcon className="h-6 w-6" crownClassName="h-[1em] w-[1em]" />
              Premium
            </a>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox:
                      "!h-9 !w-9 !border-0 !ring-0 !shadow-none",
                  },
                }}
              />
            </div>
          </div>
        </header>

        <div className="mt-7 flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 text-[2.08rem] leading-none tracking-[-0.02em] font-[Georgia,serif]">
            <Sparkles size={18} className="text-[#ff5f69]" />
            Continue
          </h2>
          <a href={ROUTES.APP} className="text-[1.35rem] text-[#8f9096]">
            View all
          </a>
        </div>

        <section className="mt-3 overflow-hidden rounded-3xl border border-[#4b2024] bg-[linear-gradient(130deg,#2d0e12_0%,#291319_45%,#160f15_100%)] p-4">
          {latestSession ? (
            <div className="flex items-center gap-3">
              <div className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/12 bg-black/24">
                <ModeIcon mode={latestSession.mode} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[1.2rem] text-[#ff6167]">{modeLabel(latestSession.mode)}</p>
                <h3 className="mt-0.5 truncate text-[2rem] leading-none tracking-[-0.024em] font-[Georgia,serif]">
                  {latestSession.title ?? "Untitled conversation"}
                </h3>
                <p className="mt-1 text-[1.2rem] text-[#c3c0be]">
                  {truncatePreview(latestSession.firstUserMessage)}
                </p>
              </div>
              <a
                href={`/app/${latestSession.id}`}
                className="inline-flex h-11 shrink-0 items-center gap-1 rounded-2xl border border-[#b9373d] bg-[#b9373d] px-3 text-[1.3rem] text-white"
              >
                Resume
                <ChevronRight size={16} />
              </a>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[1.2rem] text-[#ff6167]">Socratic Chat</p>
                <h3 className="mt-1 text-[2rem] leading-none tracking-[-0.024em] font-[Georgia,serif]">
                  Start a new thread
                </h3>
                <p className="mt-1 text-[1.2rem] text-[#c3c0be]">
                  Ask anything and keep your thinking moving.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openMode("socratic")}
                className="inline-flex h-11 shrink-0 items-center gap-1 rounded-2xl border border-[#b9373d] bg-[#b9373d] px-3 text-[1.3rem] text-white"
              >
                Open
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </section>

        <section className="relative mt-4 overflow-hidden rounded-3xl border border-[#2d2a23] bg-[linear-gradient(130deg,#090a0b_0%,#0f1012_50%,#0a0b0d_100%)] px-4 py-3.5">
          <div className="relative z-10 max-w-71">
            <p className="inline-flex items-center gap-1.5 text-[1.48rem] text-[#d7ac4f]">
              <Sparkles size={16} />
              Daily Thought
            </p>
            <p className="mt-2 text-[2rem] leading-tight tracking-[-0.02em] font-[Georgia,serif]">
              “{activeThought?.quote ?? "The unexamined life is not worth living."}”
            </p>
            <p className="mt-2 text-[1.34rem] text-[#9a9a9d]">
              — {activeThought?.philosopher ?? "Socrates"}
            </p>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-[39%]">
            <Image
              src={resolveOptimizedCloudinaryPublicAsset(
                "/twa/home/daily_thought_image.webp",
                {
                  width: 760,
                  crop: "fill",
                  quality: "auto:good",
                },
              )}
              alt="Philosopher portrait"
              fill
              sizes="36vw"
              className="object-cover object-right"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#090a0b]/40 to-[#090a0b]" />
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-[2.08rem] leading-none tracking-[-0.02em] font-[Georgia,serif]">
            Quick Actions
          </h2>

          <div className="mt-3 grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => openMode("socratic")}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-left"
            >
              <MessageCircle size={20} className="text-[#ff6267]" />
              <p className="mt-2 text-[1.34rem] leading-none font-[Georgia,serif]">
                Socratic Chat
              </p>
              <p className="mt-1 text-[1.08rem] text-[#a8a9ad]">Ask anything</p>
            </button>

            <button
              type="button"
              onClick={() => openMode("debate")}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-left"
            >
              <Swords size={20} className="text-[#ff5d66]" />
              <p className="mt-2 text-[1.34rem] leading-none font-[Georgia,serif]">
                Debate
              </p>
              <p className="mt-1 text-[1.08rem] text-[#a8a9ad]">Challenge ideas</p>
            </button>

            <button
              type="button"
              onClick={() => openMode("roleplay")}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-left"
            >
              <BookOpen size={20} className="text-[#d7ac4f]" />
              <p className="mt-2 text-[1.34rem] leading-none font-[Georgia,serif]">
                Philosophers
              </p>
              <p className="mt-1 text-[1.08rem] text-[#a8a9ad]">Talk to thinkers</p>
            </button>

            <button
              type="button"
              onClick={() => setShowToneModal(true)}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-left"
            >
              <SlidersHorizontal size={20} className="text-[#9a78f2]" />
              <p className="mt-2 text-[1.34rem] leading-none font-[Georgia,serif]">
                Choose Tone
              </p>
              <p className="mt-1 text-[1.08rem] text-[#a8a9ad]">{toneLabel}</p>
            </button>

            <button
              type="button"
              onClick={() => setShowTopicModal(true)}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-left"
            >
              <Compass size={20} className="text-[#76c983]" />
              <p className="mt-2 text-[1.34rem] leading-none font-[Georgia,serif]">
                Daily Topic
              </p>
              <p className="mt-1 text-[1.08rem] text-[#a8a9ad]">Think deeper</p>
            </button>

            <button
              type="button"
              onClick={() => window.open("https://usesocratic.com", "_blank", "noopener,noreferrer")}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-left"
            >
              <Globe size={20} className="text-[#6aa4ff]" />
              <p className="mt-2 text-[1.34rem] leading-none font-[Georgia,serif]">
                Visit Website
              </p>
              <p className="mt-1 text-[1.08rem] text-[#a8a9ad]">Learn more online</p>
            </button>
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[2.08rem] leading-none tracking-[-0.02em] font-[Georgia,serif]">
              From the Blog
            </h2>
            <a href={ROUTES.BLOG} className="text-[1.35rem] text-[#8f9096]">
              View all
            </a>
          </div>

          <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
            {blogPosts.map((post) => (
              <a
                key={post.slug}
                href={`${ROUTES.BLOG}/${post.slug}`}
                className="group relative h-52 w-50 shrink-0 snap-start overflow-hidden rounded-2xl border border-white/12"
              >
                <Image
                  src={resolveOptimizedCloudinaryPublicAsset(post.coverImagePath, {
                    width: 720,
                    crop: "fill",
                    quality: "auto:good",
                  })}
                  alt={post.title}
                  fill
                  sizes="42vw"
                  className="object-cover transition-transform duration-400 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050607] via-[#050607]/42 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="text-[1.1rem] text-[#e4b255]">{post.category}</p>
                  <h3 className="mt-1 text-[1.7rem] leading-[0.95] tracking-[-0.02em] font-[Georgia,serif]">
                    {post.title}
                  </h3>
                  <p className="mt-1 text-[1.08rem] text-white/72">{post.readTimeLabel}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

      </section>

      {showToneModal ? (
        <div
          className="fixed inset-0 z-[1000] flex items-end bg-black/60 p-3"
          onClick={() => setShowToneModal(false)}
        >
          <div
            className="w-full rounded-3xl border border-white/14 bg-[#0c0d10] p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-[2rem] leading-none tracking-[-0.02em] font-[Georgia,serif]">
              Choose Tone
            </h3>
            <div className="mt-3 space-y-2.5">
              {TONE_OPTIONS.map((tone) => (
                <button
                  key={tone.value}
                  type="button"
                  onClick={() => chooseTone(tone.value)}
                  className={`w-full rounded-2xl border p-3 text-left ${
                    selectedTone === tone.value
                      ? "border-[#af3238] bg-[#240f12]"
                      : "border-white/12 bg-white/[0.02]"
                  }`}
                >
                  <p className="text-[1.35rem] leading-none font-[Georgia,serif]">
                    {tone.label}
                  </p>
                  <p className="mt-1 text-[1.08rem] text-white/62">{tone.subtitle}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {showTopicModal ? (
        <div
          className="fixed inset-0 z-[1000] flex items-end bg-black/60 p-3"
          onClick={() => setShowTopicModal(false)}
        >
          <div
            className="w-full rounded-3xl border border-white/14 bg-[#0c0d10] p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-[2rem] leading-none tracking-[-0.02em] font-[Georgia,serif]">
              Daily Topic
            </h3>
            <p className="mt-2 text-[1.24rem] leading-relaxed text-white/86">
              {activeTopic ?? "Topic unavailable right now."}
            </p>
            <button
              type="button"
              onClick={startDailyTopic}
              disabled={!activeTopic}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-xl border border-[#af3238] bg-[#af3238] px-4 text-[1.15rem] text-white disabled:opacity-55"
            >
              Start Conversation
            </button>
          </div>
        </div>
      ) : null}

      {showUpgradeModal ? (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/62 px-4"
          onClick={() => setShowUpgradeModal(false)}
        >
          <div
            className="w-full max-w-96 rounded-3xl border border-[#d3b271] bg-[#16110a] p-5 text-[#f4e6c8]"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="inline-flex items-center gap-2 text-[2.05rem] leading-none tracking-[-0.02em] font-[Georgia,serif]">
              Go Unlimited
              <PremiumCrownIcon className="h-8 w-8" crownClassName="h-[1em] w-[1em]" />
            </h3>
            <p className="mt-2 text-[1.12rem] text-[#d7c5a0]">
              This option is part of Socratic Plus.
            </p>
            <a
              href={ROUTES.PRICING}
              className="mt-4 inline-flex h-11 items-center rounded-xl border border-[#d8bb81] bg-[#d8bb81] px-4 text-[1.1rem] text-[#1d1408]"
            >
              View Pricing
            </a>
          </div>
        </div>
      ) : null}
      </main>
    </div>
  );
}

export function TwaHomeShell(props: TwaHomeShellProps) {
  if (!props.isSignedIn) {
    return <IntroScreen />;
  }

  return (
    <DashboardScreen
      isPremium={props.isPremium}
      latestSession={props.latestSession}
      blogPosts={props.blogPosts}
      thoughts={props.thoughts}
      topics={props.topics}
      todayThought={props.todayThought}
      todayTopic={props.todayTopic}
    />
  );
}
