"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowUpRight,
  ArrowRight,
  Check,
  Clock3,
  Info,
  Sparkles,
  Swords,
  X,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { PremiumCrownIcon } from "@/src/components/billingsdk/premium-crown-icon";
import { RoseCurveLoader } from "@/src/components/ui/rose-curve-loader";
import {
  DEBATE_DURATION_OPTIONS,
  DEBATE_TOPIC_MAX_CHARS,
  DEBATE_TONE_OPTIONS,
  type DebateDurationPreset,
  type DebateTone,
} from "src/lib/debate";
import type { DebateTopicSource } from "src/types/chat";
import { ROUTES } from "@/src/lib/routes";

type Step = "tone" | "duration" | "topic" | "side" | "ready";

const stepOrder: Step[] = ["tone", "duration", "topic", "side", "ready"];

interface Props {
  canAccessDebate?: boolean;
}

export default function DebateModeSetup({ canAccessDebate = false }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("tone");
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

  const stepTextClass = "app-debate-step-label text-[11px] uppercase tracking-[0.18em]";
  const cardClass =
    "app-card app-debate-card border border-[#ddd5c7] bg-[#f7f4ee] text-[#1f1b15] shadow-[0_14px_34px_rgba(31,27,21,0.08)]";
  const headingClass = "app-debate-heading text-[#1f1b15]";
  const mutedClass = "app-debate-muted text-[#6f6658]";
  const labelClass = "app-debate-label text-[#7f7566]";
  const surfaceClass = "app-debate-surface border border-[#ddd5c7] bg-[#f1ecdf]";
  const surfaceTitleClass = "app-debate-surface-title text-[#1f1b15]";
  const optionBaseClass =
    "app-debate-option border border-[#ddd5c7] bg-[#f7f4ee] text-[#1f1b15] hover:border-[#cfc4b2] hover:bg-[#efe8db]";
  const optionSelectedClass =
    "app-debate-option app-debate-option-selected border border-[#3a3126] bg-[#3a3126] text-[#f6f2e8]";
  const optionMetaClass = "app-debate-option-meta text-[#766d60]";
  const optionMetaSelectedClass = "app-debate-option-meta text-[#d9d1c1]";
  const fieldClass =
    "app-debate-field border border-[#d6cec0] bg-[#f7f4ee] text-[#1f1b15] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)] focus:border-[#b9ad99] focus:ring-1 focus:ring-[#d6cec0] placeholder:text-[#8b8376]";
  const primaryButtonClass =
    "app-debate-primary-btn border border-[#3a3126] bg-[#3a3126] text-[#f6f2e8] hover:bg-[#30291f]";
  const secondaryButtonClass =
    "app-debate-secondary-btn border border-[#cfc4b2] bg-[#ece6d9] text-[#5d5447] hover:border-[#b9ad99] hover:bg-[#e5dece] hover:text-[#29231b]";
  const infoButtonClass =
    "app-debate-info-trigger border border-[#d6cec0] bg-[#f3ede1] text-[#73695b] hover:bg-[#ebe3d4] hover:text-[#2a241c]";
  const infoPopoverClass =
    "app-debate-info-popover border border-[#d6cec0] bg-[#f8f4eb] text-[#5d5447] shadow-[0_18px_46px_rgba(31,27,21,0.14)]";
  const errorClass =
    "app-debate-error border border-rose-300 bg-[linear-gradient(180deg,#fff6f6_0%,#ffecec_100%)] text-rose-800";
  const modalBackdropClass = "app-debate-modal-backdrop bg-[rgba(31,27,21,0.16)]";
  const modalClass =
    "app-card app-debate-modal border border-[#d6cec0] bg-[#f7f4ee] shadow-[0_14px_36px_rgba(31,27,21,0.14)]";
  const modalCloseClass =
    "app-debate-modal-close text-[#877e70] hover:bg-[#ece5d7] hover:text-[#2e271f]";

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
        const suggestions = (payload.reframingSuggestions ?? []).filter(
          (suggestion) => typeof suggestion === "string" && suggestion.trim(),
        );

        setError(
          payload.reason ||
            "That topic does not fit debate mode yet. Reframe it philosophically.",
        );
        setTopicSuggestions(suggestions);
        setPendingSuggestedTopic("");
        setShowTopicSuggestionsDialog(suggestions.length > 0);
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

  if (!canAccessDebate) {
    return (
      <div className="app-card app-upgrade-modal mx-auto w-full max-w-135 rounded-2xl border border-[#d9cec0] bg-[#fbf6ed] px-6 py-6 shadow-[0_22px_70px_rgba(33,24,12,0.16)]">
        <h2 className="app-upgrade-title inline-flex items-center gap-2 text-[31px] leading-[1.05] tracking-[-0.04em] text-[#2f2417] font-[Georgia,serif]">
          <span>
            Go Unlimited with{" "}
            <span style={{ color: "#CFA43A" }}>Socratic Plus</span>
          </span>
          <PremiumCrownIcon className="text-[36px]" />
        </h2>
        <p className="app-upgrade-copy mt-2 text-[13px] leading-6 text-[#746758]">
          Free accounts keep full core chat access. Upgrade to Socratic+ for
          timed debates, ruthless sparring, and detailed post-debate feedback.
        </p>
        <a
          href={ROUTES.PRICING}
          className="app-upgrade-primary mt-5 inline-flex items-center gap-1.5 rounded-[14px] border border-[#e7c98f] bg-[#f4ddb1] px-4 py-2 text-[13px] text-[#302111] transition hover:bg-[#ebd1a3]"
        >
          View Pricing
          <ArrowUpRight size={13} />
        </a>
      </div>
    );
  }

  return (
    <div className="app-debate-setup mx-auto w-full max-w-115 px-0 pb-4 [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed">
      <p
        className={cn(
          "mb-2",
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
                ? "app-debate-progress-active w-8 bg-[#3a3126]"
                : "app-debate-progress-inactive w-5 bg-[#ddd5c7]",
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
                  "mt-1.5 text-[24px] leading-none tracking-[-0.045em] font-[Georgia,serif] md:text-[28px]",
                  headingClass,
                )}
              >
                Choose your opponent&apos;s tone.
              </h2>
              <p
                className={cn(
                  "mt-2 max-w-96 text-[13px] leading-6",
                  mutedClass,
                )}
              >
                Choose how Socratic AI should sound while challenging your
                argument.
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
                      <p className="text-[14px] font-medium">{option.label}</p>
                      <p
                        className={cn(
                          "mt-1.5 text-[12px] leading-5",
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
                  className={cn(
                    "group relative inline-flex h-5 w-5 items-center justify-center rounded-full border transition",
                    infoButtonClass,
                  )}
                  aria-label="Explain timing options"
                >
                  <Info size={11} />
                  <div
                    className={cn(
                      "pointer-events-none absolute top-full left-0 z-10 mt-2 w-62 translate-y-1 rounded-xl border px-3 py-2.5 text-left text-[12px] leading-5 opacity-0 shadow-xl transition-all duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:pointer-events-auto group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
                      infoPopoverClass,
                    )}
                  >
                    Short formats are faster and sharper. Longer formats go
                    deeper and become more layered.
                  </div>
                </button>
              </div>
              <h2
                className={cn(
                  "mt-1.5 text-[24px] leading-none tracking-[-0.045em] font-[Georgia,serif] md:text-[28px]",
                  headingClass,
                )}
              >
                Choose the clock.
              </h2>
              <p
                className={cn(
                  "mt-2 max-w-96 text-[13px] leading-6",
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
                      <p className="text-[14px] font-medium">{option.label}</p>
                      <Clock3 size={12} className="shrink-0" />
                    </div>
                    <p
                      className={cn(
                        "mt-1.5 text-[11px] leading-5",
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
                  "mt-1.5 text-[24px] leading-none tracking-[-0.045em] font-[Georgia,serif] md:text-[28px]",
                  headingClass,
                )}
              >
                Set the topic.
              </h2>
              <p
                className={cn(
                  "mt-2 max-w-96 text-[13px] leading-6",
                  mutedClass,
                )}
              >
                Enter your own philosophy thesis or generate one.
              </p>

              <div className="mt-4">
                <label
                  className={cn(
                    "text-[11px] uppercase tracking-[0.14em]",
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
                    "mt-2 block w-full resize-none rounded-xl border px-3.5 py-2.5 text-[13px] leading-6 outline-none transition",
                    fieldClass,
                  )}
                />
                <p
                  className={cn(
                    "mt-1.5 text-right text-[11px] leading-none",
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
                    "inline-flex items-center gap-2 rounded-[12px] px-3.5 py-2 text-[12px] transition disabled:opacity-60",
                    primaryButtonClass,
                  )}
                >
                  {isBusy ? (
                    <RoseCurveLoader className="h-[1.65rem] w-[1.65rem]" />
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
                    "inline-flex items-center gap-2 rounded-[12px] border px-3.5 py-2 text-[12px] transition disabled:opacity-60",
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
                  "mt-1.5 text-[24px] leading-none tracking-[-0.045em] font-[Georgia,serif] md:text-[28px]",
                  headingClass,
                )}
              >
                Choose your side.
              </h2>
              <p
                className={cn(
                  "mt-2 max-w-96 text-[13px] leading-6",
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
                    "text-[11px] uppercase tracking-[0.14em]",
                    labelClass,
                  )}
                >
                  Confirmed topic
                </p>
                <p
                  className={cn(
                    "mt-2 text-[18px] leading-7 tracking-[-0.03em] font-[Georgia,serif]",
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
                      <p className="text-[14px] font-medium">{option.title}</p>
                      <p
                        className={cn(
                          "mt-1.5 text-[12px] leading-5",
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
                  "mt-1.5 text-[24px] leading-none tracking-[-0.045em] font-[Georgia,serif] md:text-[28px]",
                  headingClass,
                )}
              >
                Ready to begin?
              </h2>
              <p
                className={cn(
                  "mt-2 max-w-96 text-[13px] leading-6",
                  mutedClass,
                )}
              >
                Timed debates end permanently when the clock runs out.
                <br />
                After the debate ends, you&apos;ll be able to view your debate
                summary and feedback.
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
                      "text-[11px] uppercase tracking-[0.14em]",
                      labelClass,
                    )}
                  >
                    Tone
                  </p>
                  <p className={cn("mt-1.5 text-[13px]", surfaceTitleClass)}>
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
                      "text-[11px] uppercase tracking-[0.14em]",
                      labelClass,
                    )}
                  >
                    Timing
                  </p>
                  <p className={cn("mt-1.5 text-[13px]", surfaceTitleClass)}>
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
                      "text-[11px] uppercase tracking-[0.14em]",
                      labelClass,
                    )}
                  >
                    Thesis
                  </p>
                  <p
                    className={cn(
                      "mt-1.5 text-[16px] leading-7 tracking-[-0.02em] font-[Georgia,serif]",
                      surfaceTitleClass,
                    )}
                  >
                    {topic}
                  </p>
                </div>
                <div>
                  <p
                    className={cn(
                      "text-[11px] uppercase tracking-[0.14em]",
                      labelClass,
                    )}
                  >
                    Your side
                  </p>
                  <p className={cn("mt-1.5 text-[13px]", surfaceTitleClass)}>
                    {userSideLabel}
                  </p>
                </div>
                <div>
                  <p
                    className={cn(
                      "text-[11px] uppercase tracking-[0.14em]",
                      labelClass,
                    )}
                  >
                    AI side
                  </p>
                  <p className={cn("mt-1.5 text-[13px]", surfaceTitleClass)}>
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
            "mt-3 flex max-w-115 items-start gap-2 rounded-xl border px-3 py-2 text-left text-[12px] leading-5",
            errorClass,
          )}
        >
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {step !== "tone" && (
          <button
            type="button"
            onClick={goToPreviousStep}
            disabled={isBusy}
            className={cn(
              "rounded-[12px] border px-3.5 py-2 text-[12px] transition disabled:opacity-60",
              secondaryButtonClass,
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
              "inline-flex items-center gap-2 rounded-[12px] px-3.5 py-2 text-[12px] transition",
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
              "inline-flex items-center gap-2 rounded-[12px] px-3.5 py-2 text-[12px] transition",
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
              "inline-flex items-center gap-2 rounded-[12px] px-3.5 py-2 text-[12px] transition disabled:opacity-60",
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
              "inline-flex items-center gap-2 rounded-[12px] px-3.5 py-2 text-[12px] transition",
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
              "inline-flex items-center gap-2 rounded-[12px] px-4 py-2.5 text-[12px] uppercase tracking-[0.12em] transition disabled:opacity-60",
              primaryButtonClass,
            )}
          >
            {isBusy ? (
              <RoseCurveLoader className="h-[1.65rem] w-[1.65rem]" />
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
                    "text-[24px] leading-none tracking-[-0.045em] font-[Georgia,serif]",
                    headingClass,
                  )}
                >
                  Suggested topics
                </p>
                <p className={cn("mt-1.5 text-[12px] leading-5", mutedClass)}>
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
                        "text-[10px] uppercase tracking-[0.14em]",
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
                  <p className="text-[13px] leading-6">{suggestion}</p>
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
                  "app-debate-modal-cancel cursor-pointer rounded-full border px-3.5 py-1.5 text-[12px] transition",
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
                  "app-debate-modal-confirm inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] transition disabled:cursor-not-allowed disabled:opacity-50",
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
