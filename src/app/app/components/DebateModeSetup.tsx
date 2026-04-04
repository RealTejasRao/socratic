"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Clock3,
  Info,
  LoaderCircle,
  Sparkles,
  Swords,
  X,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  DEBATE_DURATION_OPTIONS,
  DEBATE_TOPIC_MAX_CHARS,
  DEBATE_TONE_OPTIONS,
  type DebateDurationPreset,
  type DebateTone,
} from "src/lib/debate";
import type { DebateTopicSource } from "src/types/chat";

type Step = "tone" | "duration" | "topic" | "side" | "ready";

const stepOrder: Step[] = ["tone", "duration", "topic", "side", "ready"];

export default function DebateModeSetup() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("tone");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [tone, setTone] = useState<DebateTone>("RUTHLESS_BLUNT");
  const [durationPreset, setDurationPreset] =
    useState<DebateDurationPreset>("MIN_30");
  const [topicInput, setTopicInput] = useState("");
  const [topicSource, setTopicSource] =
    useState<DebateTopicSource>("USER_PROVIDED");
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [userSide, setUserSide] = useState<"AFFIRM" | "REJECT">("AFFIRM");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [showTimingInfo, setShowTimingInfo] = useState(false);
  const [showTopicSuggestionsDialog, setShowTopicSuggestionsDialog] =
    useState(false);
  const [pendingSuggestedTopic, setPendingSuggestedTopic] = useState("");

  const topic = selectedTopic || topicInput.trim();
  const aiSide =
    userSide === "AFFIRM" ? "Reject the thesis" : "Affirm the thesis";
  const userSideLabel =
    userSide === "AFFIRM" ? "Affirm the thesis" : "Reject the thesis";
  const currentStepIndex = stepOrder.indexOf(step);
  const stepLabel = `Step ${currentStepIndex + 1}`;

  const stepTextClass = isDarkMode ? "text-[#9d9b95]" : "text-zinc-400";
  const cardClass = isDarkMode
    ? "border-[#3a3937] bg-[#252423] text-[#e7e7e4] shadow-[0_14px_34px_rgba(0,0,0,0.28)]"
    : "border-zinc-200 bg-white text-black shadow-sm";
  const headingClass = isDarkMode ? "text-[#f1f1ef]" : "text-black";
  const mutedClass = isDarkMode ? "text-[#b7b7b3]" : "text-zinc-600";
  const labelClass = isDarkMode ? "text-[#9d9b95]" : "text-zinc-400";
  const surfaceClass = isDarkMode
    ? "border-[#4a4946] bg-[#2f2e2c]"
    : "border-zinc-200 bg-zinc-50";
  const surfaceTitleClass = isDarkMode ? "text-[#f1f1ef]" : "text-black";
  const optionBaseClass = isDarkMode
    ? "border-[#4a4946] bg-[#2f2e2c] text-[#ecebe8] hover:border-[#62615d] hover:bg-[#333230]"
    : "border-zinc-200 bg-white text-black hover:border-zinc-400";
  const optionSelectedClass = isDarkMode
    ? "border-[#2a2a2a] bg-black text-[#f5f5f3]"
    : "border-black bg-black text-white";
  const optionMetaClass = isDarkMode ? "text-[#b7b7b3]" : "text-zinc-500";
  const optionMetaSelectedClass = isDarkMode
    ? "text-[#c6c6c2]"
    : "text-zinc-300";
  const fieldClass = isDarkMode
    ? "border-[#4a4a46] bg-[#2f2e2c] text-[#f3f3f3] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] focus:border-[#7a7770] focus:ring-1 focus:ring-[#7a7770]/55 placeholder:text-[#9d9b95]"
    : "border-zinc-300 bg-white text-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)] focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 placeholder:text-zinc-400";
  const primaryButtonClass = isDarkMode
    ? "bg-[#f1f1ef] text-[#141414] hover:bg-[#dfdfdc]"
    : "bg-black text-white hover:bg-zinc-800";
  const secondaryButtonClass = isDarkMode
    ? "border-[#67655f] bg-transparent text-[#ecebe8] hover:border-[#7a7770] hover:bg-[#333230] hover:text-white"
    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:text-black";
  const infoButtonClass = isDarkMode
    ? "border-[#4a4946] bg-[#2f2e2c] text-[#d7d7d4] hover:bg-[#333230] hover:text-[#f2f2f0]"
    : "border-zinc-200 bg-white text-zinc-500 hover:text-black";
  const infoPopoverClass = isDarkMode
    ? "border-[#2a2a2a] bg-black text-[#f5f5f3]"
    : "border-zinc-200 bg-black text-white";
  const errorClass = isDarkMode
    ? "border-[#5b4340] bg-[linear-gradient(180deg,#322625_0%,#2a2120_100%)] text-[#f3e6e4]"
    : "border-zinc-300 bg-zinc-50 text-zinc-700";
  const modalBackdropClass = isDarkMode
    ? "bg-[rgba(15,15,15,0.45)]"
    : "bg-slate-950/16";
  const modalClass = isDarkMode
    ? "border-[#3a3937] bg-[#252423] text-[#e7e7e4] shadow-[0_14px_36px_rgba(0,0,0,0.32)]"
    : "border-[#C8C8C2] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.14)]";
  const modalCloseClass = isDarkMode
    ? "text-[#b7b7b3] hover:bg-[#333230] hover:text-[#f2f2f0]"
    : "text-slate-400 hover:bg-slate-100 hover:text-slate-700";

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => {
      setIsDarkMode(root.classList.contains("app-dark"));
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!showTopicSuggestionsDialog) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isBusy) {
        setShowTopicSuggestionsDialog(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isBusy, showTopicSuggestionsDialog]);

  function goToNextStep(nextStep?: Step) {
    if (nextStep) {
      setStep(nextStep);
      return;
    }

    const index = stepOrder.indexOf(step);
    const following = stepOrder[index + 1];

    if (following) {
      setStep(following);
    }
  }

  function goToPreviousStep() {
    const index = stepOrder.indexOf(step);
    const previous = stepOrder[index - 1];

    if (previous) {
      setStep(previous);
    }
  }

  async function handleValidateCustomTopic() {
    const trimmedTopic = topicInput.trim();

    if (!trimmedTopic) {
      setError("Enter a philosophy topic or generate one.");
      return;
    }

    setError("");
    setIsBusy(true);

    try {
      const response = await fetch("/api/v1/chat/debates/topic/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: trimmedTopic }),
      });
      const payload = (await response.json()) as {
        isValid: boolean;
        normalizedTopic: string;
        reason?: string;
        reframingSuggestions?: string[];
      };

      if (!response.ok || !payload.isValid) {
        setError(
          payload.reason ||
            "That topic does not fit debate mode yet. Reframe it philosophically.",
        );
        setTopicSuggestions(payload.reframingSuggestions ?? []);
        setPendingSuggestedTopic("");
        setShowTopicSuggestionsDialog(
          (payload.reframingSuggestions?.length ?? 0) > 0,
        );
        return;
      }

      setSelectedTopic(payload.normalizedTopic);
      setTopicSource("USER_PROVIDED");
      setTopicSuggestions([]);
      setShowTopicSuggestionsDialog(false);
      goToNextStep("side");
    } catch {
      setError("Topic validation failed. Try again.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleGenerateTopics() {
    setError("");
    setIsBusy(true);

    try {
      const response = await fetch("/api/v1/chat/debates/topic/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone, durationPreset }),
      });
      const payload = (await response.json()) as { topics?: string[] };

      setTopicSuggestions(payload.topics ?? []);
      setPendingSuggestedTopic("");
      setShowTopicSuggestionsDialog((payload.topics?.length ?? 0) > 0);
      setTopicSource("AI_GENERATED");
    } catch {
      setError("Topic generation failed. Try again.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleStartDebate() {
    if (!topic) {
      setError("Choose a topic before starting.");
      return;
    }

    setError("");
    setIsBusy(true);

    try {
      const response = await fetch("/api/v1/chat/debates/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tone,
          durationPreset,
          topic,
          topicSource,
          userSide: userSideLabel,
          aiSide,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          reason?: string;
        } | null;
        setError(payload?.reason || "Could not start the debate.");
        setIsBusy(false);
        return;
      }

      const payload = (await response.json()) as { id: string };
      router.push(`/app/${payload.id}`);
      router.refresh();
      return;
    } catch {
      setError("Could not start the debate.");
      setIsBusy(false);
    }
  }

  return (
    <div className="app-debate-setup mx-auto w-full max-w-115 px-0 pb-4 [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed">
      <p
        className={cn(
          "mb-2 text-[10px] uppercase tracking-[0.28em]",
          stepTextClass,
        )}
      >
        {stepLabel}
      </p>

      <div className="mb-4 flex items-center gap-1.5">
        {stepOrder.map((stepName, index) => (
          <div
            key={stepName}
            className={cn(
              "h-1 rounded-full transition-all",
              index <= currentStepIndex
                ? isDarkMode
                  ? "w-8 bg-[#f1f1ef]"
                  : "w-8 bg-black"
                : isDarkMode
                  ? "w-5 bg-[#4a4946]"
                  : "w-5 bg-zinc-200",
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className={cn("w-full rounded-2xl border p-4 text-left", cardClass)}
        >
          {step === "tone" && (
            <div>
              <h2
                className={cn(
                  "mt-1.5 text-[20px] leading-none tracking-[-0.05em] font-[Georgia,serif] md:text-[24px]",
                  headingClass,
                )}
              >
                Choose your opponent.
              </h2>
              <p
                className={cn(
                  "mt-1.5 max-w-85 text-[10px] leading-5",
                  mutedClass,
                )}
              >
                Choose how hard Socratic AI should come at your argument.
              </p>

              <div className="mt-4 space-y-2">
                {DEBATE_TONE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTone(option.value)}
                    className={cn(
                      "flex w-full items-start justify-between rounded-xl border px-3.5 py-2.5 text-left transition",
                      tone === option.value
                        ? optionSelectedClass
                        : optionBaseClass,
                    )}
                  >
                    <div>
                      <p className="text-[12px] font-medium">{option.label}</p>
                      <p
                        className={cn(
                          "mt-1 text-[10px] leading-5",
                          tone === option.value
                            ? optionMetaSelectedClass
                            : optionMetaClass,
                        )}
                      >
                        {option.description}
                      </p>
                    </div>
                    {tone === option.value && (
                      <Check size={14} className="mt-0.5 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "duration" && (
            <div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTimingInfo((current) => !current)}
                  className={cn(
                    "relative inline-flex h-5 w-5 items-center justify-center rounded-full border transition",
                    infoButtonClass,
                  )}
                  aria-label="Explain timing options"
                >
                  <Info size={11} />
                  {showTimingInfo && (
                    <div
                      className={cn(
                        "absolute top-full left-0 z-10 mt-2 w-56 rounded-xl border px-3 py-2.5 text-left text-[10px] leading-5 shadow-xl",
                        infoPopoverClass,
                      )}
                    >
                      Short formats are faster and sharper. Longer formats go
                      deeper and become more layered.
                    </div>
                  )}
                </button>
              </div>
              <h2
                className={cn(
                  "mt-1.5 text-[20px] leading-none tracking-[-0.05em] font-[Georgia,serif] md:text-[24px]",
                  headingClass,
                )}
              >
                Choose the clock.
              </h2>
              <p
                className={cn(
                  "mt-1.5 max-w-85 text-[10px] leading-5",
                  mutedClass,
                )}
              >
                Duration changes both the timer and the style of the debate.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {DEBATE_DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDurationPreset(option.value)}
                    className={cn(
                      "flex min-h-18.5 w-full flex-col rounded-xl border px-3 py-2 text-left transition",
                      durationPreset === option.value
                        ? optionSelectedClass
                        : optionBaseClass,
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-medium">{option.label}</p>
                      <Clock3 size={12} className="shrink-0" />
                    </div>
                    <p
                      className={cn(
                        "mt-1.5 text-[9px] leading-4",
                        durationPreset === option.value
                          ? optionMetaSelectedClass
                          : optionMetaClass,
                      )}
                    >
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "topic" && (
            <div>
              <h2
                className={cn(
                  "mt-1.5 text-[20px] leading-none tracking-[-0.05em] font-[Georgia,serif] md:text-[24px]",
                  headingClass,
                )}
              >
                Set the topic.
              </h2>
              <p
                className={cn(
                  "mt-1.5 max-w-85 text-[10px] leading-5",
                  mutedClass,
                )}
              >
                Enter your own philosophy thesis or generate one.
              </p>

              <div className="mt-4">
                <label
                  className={cn(
                    "text-[10px] uppercase tracking-[0.2em]",
                    labelClass,
                  )}
                >
                  Debate topic
                </label>
                <textarea
                  value={topicInput}
                  onChange={(event) => {
                    setTopicInput(event.target.value);
                    setSelectedTopic("");
                    setError("");
                  }}
                  maxLength={DEBATE_TOPIC_MAX_CHARS}
                  rows={4}
                  placeholder="Example: Moral progress is mostly a myth societies tell themselves."
                  className={cn(
                    "mt-2 block w-full resize-none rounded-xl border px-3 py-2 text-[11px] leading-5 outline-none transition",
                    fieldClass,
                  )}
                />
                <p
                  className={cn(
                    "mt-1.5 text-right text-[10px] leading-none",
                    mutedClass,
                  )}
                >
                  {topicInput.length}/{DEBATE_TOPIC_MAX_CHARS}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleValidateCustomTopic()}
                  disabled={isBusy}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] transition disabled:opacity-60",
                    primaryButtonClass,
                  )}
                >
                  {isBusy ? (
                    <LoaderCircle size={13} className="animate-spin" />
                  ) : (
                    <ArrowRight size={13} />
                  )}
                  Use this topic
                </button>
                <button
                  type="button"
                  onClick={() => void handleGenerateTopics()}
                  disabled={isBusy}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] transition disabled:opacity-60",
                    secondaryButtonClass,
                  )}
                >
                  <Sparkles size={13} />
                  Generate topics
                </button>
              </div>
            </div>
          )}

          {step === "side" && (
            <div>
              <h2
                className={cn(
                  "mt-1.5 text-[20px] leading-none tracking-[-0.05em] font-[Georgia,serif] md:text-[24px]",
                  headingClass,
                )}
              >
                Choose your side.
              </h2>
              <p
                className={cn(
                  "mt-1.5 max-w-85 text-[10px] leading-5",
                  mutedClass,
                )}
              >
                Pick whether you defend the thesis or attack it.
              </p>

              <div
                className={cn(
                  "mt-4 rounded-xl border px-3.5 py-2.5",
                  surfaceClass,
                )}
              >
                <p
                  className={cn(
                    "text-[10px] uppercase tracking-[0.2em]",
                    labelClass,
                  )}
                >
                  Confirmed thesis
                </p>
                <p
                  className={cn(
                    "mt-2 text-[16px] leading-6 tracking-[-0.04em] font-[Georgia,serif]",
                    surfaceTitleClass,
                  )}
                >
                  {topic}
                </p>
              </div>

              <div className="mt-3 space-y-2">
                {[
                  {
                    value: "AFFIRM" as const,
                    title: "Affirm the thesis",
                    body: "You defend the claim. Socratic AI attacks it.",
                  },
                  {
                    value: "REJECT" as const,
                    title: "Reject the thesis",
                    body: "You attack the claim. Socratic AI defends it.",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setUserSide(option.value)}
                    className={cn(
                      "flex w-full items-start justify-between rounded-xl border px-3.5 py-2.5 text-left transition",
                      userSide === option.value
                        ? optionSelectedClass
                        : optionBaseClass,
                    )}
                  >
                    <div>
                      <p className="text-[12px] font-medium">{option.title}</p>
                      <p
                        className={cn(
                          "mt-1 text-[10px] leading-5",
                          userSide === option.value
                            ? optionMetaSelectedClass
                            : optionMetaClass,
                        )}
                      >
                        {option.body}
                      </p>
                    </div>
                    {userSide === option.value && (
                      <Check size={14} className="mt-0.5 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "ready" && (
            <div>
              <h2
                className={cn(
                  "mt-1.5 text-[20px] leading-none tracking-[-0.05em] font-[Georgia,serif] md:text-[24px]",
                  headingClass,
                )}
              >
                Ready to begin?
              </h2>
              <p
                className={cn(
                  "mt-1.5 max-w-85 text-[10px] leading-5",
                  mutedClass,
                )}
              >
                Timed debates end permanently when the clock runs out.
              </p>

              <div
                className={cn(
                  "mt-4 grid gap-2.5 rounded-2xl border p-3.5 md:grid-cols-2",
                  surfaceClass,
                )}
              >
                <div>
                  <p
                    className={cn(
                      "text-[10px] uppercase tracking-[0.18em]",
                      labelClass,
                    )}
                  >
                    Tone
                  </p>
                  <p className={cn("mt-1.5 text-[12px]", surfaceTitleClass)}>
                    {
                      DEBATE_TONE_OPTIONS.find(
                        (option) => option.value === tone,
                      )?.label
                    }
                  </p>
                </div>
                <div>
                  <p
                    className={cn(
                      "text-[10px] uppercase tracking-[0.18em]",
                      labelClass,
                    )}
                  >
                    Timing
                  </p>
                  <p className={cn("mt-1.5 text-[12px]", surfaceTitleClass)}>
                    {
                      DEBATE_DURATION_OPTIONS.find(
                        (option) => option.value === durationPreset,
                      )?.label
                    }
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p
                    className={cn(
                      "text-[10px] uppercase tracking-[0.18em]",
                      labelClass,
                    )}
                  >
                    Thesis
                  </p>
                  <p
                    className={cn(
                      "mt-1.5 text-[14px] leading-6 tracking-[-0.03em] font-[Georgia,serif]",
                      surfaceTitleClass,
                    )}
                  >
                    {topic}
                  </p>
                </div>
                <div>
                  <p
                    className={cn(
                      "text-[10px] uppercase tracking-[0.18em]",
                      labelClass,
                    )}
                  >
                    Your side
                  </p>
                  <p className={cn("mt-1.5 text-[12px]", surfaceTitleClass)}>
                    {userSideLabel}
                  </p>
                </div>
                <div>
                  <p
                    className={cn(
                      "text-[10px] uppercase tracking-[0.18em]",
                      labelClass,
                    )}
                  >
                    AI side
                  </p>
                  <p className={cn("mt-1.5 text-[12px]", surfaceTitleClass)}>
                    {aiSide}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {error && (
        <div
          className={cn(
            "mt-3 max-w-115 rounded-xl border px-3 py-2 text-left text-[10px] leading-5",
            errorClass,
          )}
        >
          {error}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {step !== "tone" && (
          <button
            type="button"
            onClick={goToPreviousStep}
            disabled={isBusy}
            className={cn(
              "rounded-lg border px-3 py-2 text-[10px] transition disabled:opacity-60",
              secondaryButtonClass,
              !isDarkMode && "border-black!",
            )}
          >
            Back
          </button>
        )}

        {step === "tone" && (
          <button
            type="button"
            onClick={() => goToNextStep()}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] transition",
              primaryButtonClass,
            )}
          >
            Continue
            <ArrowRight size={13} />
          </button>
        )}

        {step === "duration" && (
          <button
            type="button"
            onClick={() => goToNextStep()}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] transition",
              primaryButtonClass,
            )}
          >
            Continue
            <ArrowRight size={13} />
          </button>
        )}

        {step === "topic" && selectedTopic && (
          <button
            type="button"
            onClick={() => goToNextStep("side")}
            disabled={isBusy}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] transition disabled:opacity-60",
              primaryButtonClass,
            )}
          >
            Continue
            <ArrowRight size={13} />
          </button>
        )}

        {step === "side" && (
          <button
            type="button"
            onClick={() => goToNextStep("ready")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] transition",
              primaryButtonClass,
            )}
          >
            Continue
            <ArrowRight size={13} />
          </button>
        )}

        {step === "ready" && (
          <button
            type="button"
            onClick={() => void handleStartDebate()}
            disabled={isBusy}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] transition disabled:opacity-60",
              primaryButtonClass,
            )}
          >
            {isBusy ? (
              <LoaderCircle size={13} className="animate-spin" />
            ) : (
              <Swords size={13} />
            )}
            Begin debate
          </button>
        )}
      </div>

      {showTopicSuggestionsDialog && topicSuggestions.length > 0 && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]",
            modalBackdropClass,
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Suggested debate topics"
          onClick={() => {
            if (!isBusy) {
              setShowTopicSuggestionsDialog(false);
            }
          }}
        >
          <div
            className={cn(
              "w-full max-w-90 rounded-[9px] border px-4 py-3.5",
              modalClass,
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p
                  className={cn(
                    "text-[22px] leading-none tracking-[-0.05em] font-[Georgia,serif]",
                    headingClass,
                  )}
                >
                  Suggested topics
                </p>
                <p className={cn("mt-1 text-[10px] leading-4", mutedClass)}>
                  Pick one thesis to drop into the debate setup.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTopicSuggestionsDialog(false)}
                disabled={isBusy}
                className={cn(
                  "cursor-pointer rounded-full p-1 transition disabled:cursor-not-allowed disabled:opacity-40",
                  modalCloseClass,
                )}
                aria-label="Close dialog"
              >
                <X size={12} />
              </button>
            </div>

            <div className="grid gap-2">
              {topicSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setPendingSuggestedTopic(suggestion);
                  }}
                  className={cn(
                    "group flex w-full flex-col gap-2 rounded-xl border px-3.5 py-3 text-left transition",
                    pendingSuggestedTopic === suggestion
                      ? optionSelectedClass
                      : optionBaseClass,
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p
                      className={cn(
                        "text-[9px] uppercase tracking-[0.18em]",
                        pendingSuggestedTopic === suggestion
                          ? optionMetaSelectedClass
                          : optionMetaClass,
                      )}
                    >
                      Topic {index + 1}
                    </p>
                    <Sparkles
                      size={12}
                      className={cn(
                        pendingSuggestedTopic === suggestion
                          ? "text-zinc-300"
                          : "text-zinc-400 group-hover:text-zinc-600",
                      )}
                    />
                  </div>
                  <p className="text-[12px] leading-5">{suggestion}</p>
                </button>
              ))}
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPendingSuggestedTopic("");
                  setShowTopicSuggestionsDialog(false);
                }}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1.5 text-[10px] transition",
                  secondaryButtonClass,
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!pendingSuggestedTopic) {
                    return;
                  }

                  setSelectedTopic(pendingSuggestedTopic);
                  setTopicInput(pendingSuggestedTopic);
                  setTopicSource("AI_GENERATED");
                  setError("");
                  setShowTopicSuggestionsDialog(false);
                }}
                disabled={!pendingSuggestedTopic}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] transition disabled:cursor-not-allowed disabled:opacity-50",
                  primaryButtonClass,
                )}
              >
                <Check size={11} />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
