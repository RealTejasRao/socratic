"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import {
  Cormorant_Garamond,
  Instrument_Serif,
  Inter,
  Poppins,
} from "next/font/google";
import { useEffect, useMemo, useRef, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  MessagesSquare,
  ScrollText,
  SlidersHorizontal,
  Sparkles,
  Swords,
} from "lucide-react";
import { PremiumCrownIcon } from "@/src/components/billingsdk/premium-crown-icon";
import { resolveOptimizedCloudinaryPublicAsset } from "@/src/lib/cloudinary-public-assets";
import { ROUTES } from "@/src/lib/routes";
import type { SessionMode } from "@/src/types/chat";

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400" });
const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

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
  thoughts: { quote: string; philosopher: string }[];
  topics: string[];
  todayThought: { quote: string; philosopher: string } | null;
  todayTopic: string | null;
};

type DashboardScreenProps = Pick<
  TwaHomeShellProps,
  "isPremium" | "latestSession" | "blogPosts"
>;

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
    label: "Simple & clear",
    subtitle: "Plain language. Easy to follow.",
  },
  {
    value: "BALANCED",
    label: "Encouraging",
    subtitle: "Warm pressure with steady guidance.",
  },
  {
    value: "RUTHLESS_BLUNT",
    label: "Ruthless",
    subtitle: "Sharp challenge. No cushioning.",
  },
] as const;

type ToneValue = (typeof TONE_OPTIONS)[number]["value"];
const ABOUT_BLOG_HREF = "/blog/what-is-socratic-ai" as Route;

function modeLabel(mode: SessionMode) {
  if (mode === "DEBATE") return "Debate Mode";
  if (mode === "ROLEPLAY") return "Role Play Mode";
  return "Socratic Mode";
}

function getBlogCategoryAccent(category: string) {
  if (category === "AI & Learning") return "bg-[#7ea8ff]";
  if (category === "About") return "bg-[#f3bf73]";
  return "bg-[#9c73ff]";
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

    setActiveIndex((current) =>
      current === closestIndex ? current : closestIndex,
    );
  };

  return (
    <div className="pwa-standalone-only">
      <main
        className={`relative h-svh overflow-hidden bg-black text-white ${inter.className}`}
      >
        <section className="relative z-10 h-full px-4 pt-[calc(0.7rem+env(safe-area-inset-top))]">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between">
              <Image
                src="/brand/Logo_Light_SVG.svg"
                alt="Socratic AI"
                width={38}
                height={38}
                className="h-8.9 w-8.9 opacity-95"
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
                <div className="relative z-10 max-w-49 pt-2">
                  <h1
                    className={`${instrumentSerif.className} text-[2.35rem] leading-[0.92] tracking-[-0.025em]`}
                  >
                    Socratic AI
                  </h1>
                  <p
                    className={`${instrumentSerif.className} mt-1.5 text-[1.02rem] leading-[1.16] tracking-[-0.005em]`}
                  >
                    Sharpen your{" "}
                    <span className="text-[#d44b51]">thinking.</span>
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
                    className="object-contain object-top-right"
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
                <div className="contents">
                  {INTRO_CARDS.map((card) => {
                    const Icon = card.icon;
                    return (
                      <article
                        key={card.id}
                        ref={(element) => {
                          cardRefs.current[Number(card.id) - 1] = element;
                        }}
                        className="relative min-h-97 w-[72%] shrink-0 snap-start overflow-hidden rounded-3xl border border-white/20 bg-black"
                      >
                        <div className="pointer-events-none absolute -right-[5%] top-0 h-[56%] w-[72%]">
                          <Image
                            src={resolveOptimizedCloudinaryPublicAsset(
                              card.image,
                              {
                                width: 960,
                                crop: "fill",
                                quality: "auto:good",
                              },
                            )}
                            alt={card.title}
                            fill
                            sizes="80vw"
                            className="object-cover object-top opacity-[0.3]"
                          />
                          <div className="absolute inset-0 bg-linear-to-l from-black/22 via-black/60 to-black" />
                          <div className="absolute inset-0 bg-linear-to-b from-black/5 via-black/67 to-black" />
                        </div>

                        <div className="relative z-10 flex h-full flex-col p-4.5">
                          <span className="text-[0.78rem] tracking-[0.08em] text-[#d84545]">
                            {card.id}
                          </span>
                          <div className="mt-5 inline-flex h-10.5 w-10.5 items-center justify-center rounded-full bg-[#8c1a22]/30 text-[#ff5a5a]">
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
                      index === activeIndex
                        ? "w-5 bg-[#df434d]"
                        : "w-2 bg-white/28"
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
}: DashboardScreenProps) {
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const activeTone = useMemo(
    () =>
      TONE_OPTIONS.find((tone) => tone.value === selectedTone) ??
      TONE_OPTIONS[0],
    [selectedTone],
  );

  const openMode = (mode: "socratic" | "debate" | "roleplay") => {
    if (mode === "debate" && !isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    router.push(`/app?mode=${mode}`);
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
  const sessionTitle =
    latestSession?.title ?? latestSession?.firstUserMessage ?? "Fresh thread";
  const sessionHref = latestSession
    ? `/app/${latestSession.id}`
    : "/app?mode=socratic";
  const sessionMode = latestSession
    ? modeLabel(latestSession.mode)
    : "Socratic Mode";
  const sessionArtwork = "/twa/home/daily_thought_image.webp";
  const heroPills = [
    {
      key: "debate",
      label: "Debate",
      icon: Swords,
      iconClassName: "text-[#ff7b82]",
      onClick: () => openMode("debate"),
    },
    {
      key: "roleplay",
      label: "Role play",
      icon: ScrollText,
      iconClassName: "text-[#f0c575]",
      onClick: () => openMode("roleplay"),
    },
    {
      key: "tone",
      label: "Change tone",
      icon: SlidersHorizontal,
      iconClassName: "text-[#b69aff]",
      onClick: () => setShowToneModal(true),
    },
  ] as const;

  return (
    <div className="pwa-standalone-only">
      <main
        className={`relative min-h-svh overflow-hidden bg-[#05060a] text-[#f2f0eb] ${poppins.className}`}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(87,104,193,0.15),transparent_28%),radial-gradient(circle_at_88%_9%,rgba(248,177,91,0.14),transparent_22%),linear-gradient(180deg,#070910_0%,#05060a_100%)]" />
          <div className="absolute -left-14 top-34 h-42 w-42 rounded-full bg-[#7f62ff]/10 blur-3xl" />
          <div className="absolute -right-10 top-18 h-36 w-36 rounded-full bg-[#f0a54f]/10 blur-3xl" />
        </div>

        <section className="relative mx-auto w-full max-w-116 px-4 pb-[calc(6.4rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
          <header className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Image
                src="/brand/Logo_Light_SVG.svg"
                alt="Socratic AI"
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 opacity-95"
                priority
              />
              <div className="min-w-0">
                <h1
                  className={`${inter.className} text-[1.62rem] font-normal leading-none tracking-[-0.03em] text-white`}
                >
                  Socratic AI
                </h1>
                <p className="mt-1 text-[0.76rem] font-medium tracking-[0.01em] text-[#8f9097]">
                  Think Better.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={isPremium ? ROUTES.APP_BILLING : ROUTES.PRICING}
                aria-label="Premium"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/4 text-[#e3bb5d]"
              >
                <PremiumCrownIcon
                  className="h-9 w-9"
                  crownClassName="h-[1em] w-[1em]"
                />
              </a>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/4">
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

          <button
            type="button"
            onClick={() => openMode("socratic")}
            className="group relative mt-6 w-full overflow-hidden rounded-[1.45rem] border border-[#8f72ff]/38 bg-[linear-gradient(135deg,rgba(18,21,36,0.98)_0%,rgba(12,13,24,0.98)_56%,rgba(28,22,52,0.96)_100%)] px-4 py-4 text-left shadow-[0_20px_55px_rgba(0,0,0,0.42),0_0_0_1px_rgba(160,128,255,0.08)] backdrop-blur-xl"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(170,136,255,0.24),transparent_36%),radial-gradient(circle_at_0%_100%,rgba(73,102,198,0.18),transparent_28%)]" />
            <div className="pointer-events-none absolute inset-[1px] rounded-[1.4rem] border border-white/6" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,rgba(170,136,255,0),rgba(170,136,255,0.95),rgba(170,136,255,0))]" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="min-w-0 flex-1 pr-1">
                <h2
                  className={`${inter.className} whitespace-nowrap bg-[linear-gradient(90deg,#f4f2ff_0%,#ded5ff_58%,#9a82ff_100%)] bg-clip-text text-[1.04rem] font-medium leading-none tracking-[-0.035em] text-transparent`}
                >
                  What are you thinking about?
                </h2>
              </div>
              <span className="inline-flex h-13 w-13 shrink-0 items-center justify-center rounded-full border border-[#ccb8ff]/28 bg-[radial-gradient(circle_at_32%_28%,#fcf8ff_0%,#c9b6ff_26%,#9a7aff_58%,#7250f0_100%)] text-white shadow-[0_0_28px_rgba(147,108,255,0.52)] transition duration-300 group-active:scale-95">
                <Sparkles size={16} fill="currentColor" />
              </span>
            </div>
          </button>

          <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
            {heroPills.map((pill) => {
              const Icon = pill.icon;

              return (
                <button
                  key={pill.key}
                  type="button"
                  onClick={pill.onClick}
                  className="inline-flex h-10.5 shrink-0 items-center gap-2 rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.055)_0%,rgba(255,255,255,0.025)_100%)] px-4 text-[0.77rem] font-medium text-white/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-xl transition active:scale-[0.98]"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_100%)] shadow-[0_0_18px_rgba(255,255,255,0.03)]">
                    <Icon size={15} className={pill.iconClassName} />
                  </span>
                  {pill.label}
                </button>
              );
            })}
          </div>

          <a
            href={sessionHref}
            className="group relative mt-5 block overflow-hidden rounded-[1.45rem] border border-white/10 bg-[linear-gradient(140deg,rgba(18,20,28,0.96)_0%,rgba(9,10,16,0.98)_100%)] shadow-[0_22px_60px_rgba(0,0,0,0.32)]"
          >
            <div className="pointer-events-none absolute inset-y-0 right-0 w-[44%]">
              <Image
                src={resolveOptimizedCloudinaryPublicAsset(sessionArtwork, {
                  width: 820,
                  crop: "fill",
                  quality: "auto:good",
                })}
                alt={sessionMode}
                fill
                sizes="40vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,10,16,0.96)_0%,rgba(9,10,16,0.42)_40%,rgba(9,10,16,0.14)_100%)]" />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(118,145,255,0.12),transparent_28%)]" />
            <div className="relative z-10 flex min-h-[9rem] items-end justify-between gap-3 p-4">
              <div className="min-w-0 max-w-[64%]">
                <p className="text-[0.72rem] text-white/55">
                  Continue where you left off
                </p>
                <span className="mt-2 inline-flex rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#c3cae3]">
                  {sessionMode}
                </span>
                <h3
                  className={`${inter.className} mt-2 line-clamp-2 text-[1.02rem] font-medium leading-[1.18] tracking-[-0.03em] text-white`}
                >
                  {sessionTitle}
                </h3>
              </div>
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] text-white/88 backdrop-blur-sm transition group-active:scale-95">
                <ChevronRight size={17} />
              </span>
            </div>
          </a>

          <section className="mt-6">
            <div className="flex items-center justify-between">
              <h2
                className={`text-[1.18rem] font-medium leading-none tracking-[-0.03em] text-white ${inter.className}`}
              >
                Blogs
              </h2>
              <a
                href={ROUTES.BLOG}
                className="inline-flex items-center gap-1 text-[0.74rem] text-white/58"
              >
                See all <ChevronRight size={14} />
              </a>
            </div>

            <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
              {blogPosts.map((post) => (
                <a
                  key={post.slug}
                  href={`${ROUTES.BLOG}/${post.slug}`}
                  className="group relative h-52 w-[12.8rem] shrink-0 snap-start overflow-hidden rounded-[1.2rem] border border-white/12 bg-black"
                >
                  <Image
                    src={resolveOptimizedCloudinaryPublicAsset(
                      post.coverImagePath,
                      {
                        width: 720,
                        crop: "fill",
                        quality: "auto:good",
                      },
                    )}
                    alt={post.title}
                    fill
                    sizes="38vw"
                    className="object-cover transition-transform duration-400 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,8,0.06)_18%,rgba(5,6,8,0.64)_70%,rgba(5,6,8,0.96)_100%)]" />
                  <div className="absolute left-3 top-3 inline-flex rounded-full border border-white/14 bg-black/32 px-2.5 py-1 text-[0.66rem] font-medium text-white/88 backdrop-blur-md">
                    {post.readTimeLabel}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-3.5">
                    <h3
                      className={`${inter.className} line-clamp-2 text-[0.98rem] font-medium leading-[1.18] tracking-[-0.03em] text-white`}
                    >
                      {post.title}
                    </h3>
                    <p className="mt-2 inline-flex items-center gap-2 text-[0.7rem] text-white/62">
                      <span
                        className={`h-2 w-2 rounded-full ${getBlogCategoryAccent(post.category)}`}
                      />
                      {post.category}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        </section>

        {showToneModal ? (
          <div
            className="fixed inset-0 z-1000 flex items-end bg-black/66 px-3 pb-[calc(0.8rem+env(safe-area-inset-bottom))] pt-8"
            onClick={() => setShowToneModal(false)}
          >
            <div
              className="relative w-full overflow-hidden rounded-[1.5rem] border border-white/12 bg-[linear-gradient(180deg,rgba(15,16,23,0.98)_0%,rgba(9,10,16,0.98)_100%)] p-4 backdrop-blur-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(171,134,255,0.2),transparent_34%)]" />
              <div className="relative z-10">
                <div className="mx-auto h-1 w-10 rounded-full bg-white/14" />
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.66rem] font-medium uppercase tracking-[0.18em] text-white/38">
                      Change tone
                    </p>
                    <h3
                      className={`${inter.className} mt-1 text-[1.05rem] font-medium leading-none tracking-[-0.03em] text-white`}
                    >
                      Pick how Socratic responds
                    </h3>
                    <p className="mt-1.5 text-[0.76rem] leading-[1.45] text-white/58">
                      Same depth, different pressure.
                    </p>
                  </div>
                  <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.68rem] text-white/68">
                    {activeTone.label}
                  </span>
                </div>

                <div className="mt-4 space-y-2.5">
                  {TONE_OPTIONS.map((tone) => {
                    const isSelected = selectedTone === tone.value;
                    const isLocked =
                      tone.value === "RUTHLESS_BLUNT" && !isPremium;

                    return (
                      <button
                        key={tone.value}
                        type="button"
                        onClick={() => chooseTone(tone.value)}
                        className={`w-full rounded-[1.1rem] border p-3.5 text-left transition ${
                          isSelected
                            ? "border-[#8f72ff]/55 bg-[#181425]"
                            : "border-white/10 bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                  tone.value === "SIMPLE_CLEAR"
                                    ? "bg-[#85b2ff]"
                                    : tone.value === "BALANCED"
                                      ? "bg-[#72d39a]"
                                      : "bg-[#ff7f86]"
                                }`}
                              />
                              <p
                                className={`${inter.className} text-[0.88rem] font-medium tracking-[-0.02em] text-white`}
                              >
                                {tone.label}
                              </p>
                            </div>
                            <p className="mt-1 pl-[1.1rem] text-[0.72rem] leading-[1.5] text-white/56">
                              {tone.subtitle}
                            </p>
                          </div>
                          <span
                            className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[0.64rem] font-medium ${
                              isSelected
                                ? "border-[#8f72ff]/45 bg-[#8f72ff]/12 text-[#d7d0ff]"
                                : isLocked
                                  ? "border-[#73532c] bg-[#2a1d0f] text-[#e1be7a]"
                                  : "border-white/10 bg-white/[0.04] text-white/68"
                            }`}
                          >
                            {isSelected
                              ? "Active"
                              : isLocked
                                ? "Plus"
                                : "Choose"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {showUpgradeModal ? (
          <div
            className="fixed inset-0 z-1100 flex items-center justify-center bg-black/62 px-4"
            onClick={() => setShowUpgradeModal(false)}
          >
            <div
              className="w-full max-w-88 rounded-[1.25rem] border border-[#d3b271] bg-[#16110a] p-4 text-[#f4e6c8]"
              onClick={(event) => event.stopPropagation()}
            >
              <h3
                className={`inline-flex items-center gap-1.5 text-[1.18rem] leading-none tracking-[-0.01em] ${cormorantGaramond.className}`}
              >
                Go Unlimited
                <PremiumCrownIcon
                  className="h-5 w-5"
                  crownClassName="h-[1em] w-[1em]"
                />
              </h3>
              <p className="mt-2 text-[0.82rem] text-[#d7c5a0]">
                This option is part of Socratic Plus.
              </p>
              <a
                href={ROUTES.PRICING}
                className="mt-4 inline-flex h-10 items-center rounded-[0.85rem] border border-[#d8bb81] bg-[#d8bb81] px-4 text-[0.82rem] font-medium text-[#1d1408]"
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
    />
  );
}
