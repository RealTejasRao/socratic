"use client";

import { useEffect, useMemo, useState } from "react";
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
  DEBATE_TONE_OPTIONS,
  type DebateDurationPreset,
  type DebateTone,
} from "src/lib/debate";
import type { DebateTopicSource } from "src/types/chat";

type Step = "tone" | "duration" | "topic" | "side" | "reveal" | "ready";

const stepOrder: Step[] = [
  "tone",
  "duration",
  "topic",
  "side",
  "reveal",
  "ready",
];

export default function DebateModeSetup() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("tone");
  const [tone, setTone] = useState<DebateTone>("RUTHLESS_RESPECTFUL");
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

  const revealSubtitle = useMemo(() => {
    const toneLabel =
      DEBATE_TONE_OPTIONS.find((option) => option.value === tone)?.label ??
      "Ruthless, Respectful";
    const durationLabel =
      DEBATE_DURATION_OPTIONS.find((option) => option.value === durationPreset)
        ?.label ?? "30 min";

    return `${toneLabel} · ${durationLabel}`;
  }, [durationPreset, tone]);

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
        const payload = (await response.json().catch(() => null)) as
          | { reason?: string }
          | null;
        setError(payload?.reason || "Could not start the debate.");
        return;
      }

      const payload = (await response.json()) as { id: string };
      router.push(`/app/${payload.id}`);
      router.refresh();
    } catch {
      setError("Could not start the debate.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[460px] px-0 pb-4 [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed">
      <p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-zinc-400">
        {stepLabel}
      </p>

      <div className="mb-4 flex items-center gap-1.5">
        {stepOrder.map((stepName, index) => (
          <div
            key={stepName}
            className={cn(
              "h-1 rounded-full transition-all",
              index <= currentStepIndex ? "w-8 bg-black" : "w-5 bg-zinc-200",
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
          className="w-full rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm"
        >
          {step === "tone" && (
            <div>
              <h2 className="mt-1.5 text-[20px] leading-none tracking-[-0.05em] text-black [font-family:Georgia,serif] md:text-[24px]">
                Pick the pressure.
              </h2>
              <p className="mt-1.5 max-w-[340px] text-[10px] leading-5 text-zinc-600">
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
                        ? "border-black bg-black text-white"
                        : "border-zinc-200 bg-white text-black hover:border-zinc-400",
                    )}
                  >
                    <div>
                      <p className="text-[12px] font-medium">{option.label}</p>
                      <p
                        className={cn(
                          "mt-1 text-[10px] leading-5",
                          tone === option.value
                            ? "text-zinc-300"
                            : "text-zinc-500",
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
                  className="relative inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:text-black"
                  aria-label="Explain timing options"
                >
                  <Info size={11} />
                  {showTimingInfo && (
                    <div className="absolute top-full left-0 z-10 mt-2 w-56 rounded-xl border border-zinc-200 bg-black px-3 py-2.5 text-left text-[10px] leading-5 text-white shadow-xl">
                      Short formats are faster and sharper. Longer formats go
                      deeper and become more layered.
                    </div>
                  )}
                </button>
              </div>
              <h2 className="mt-1.5 text-[20px] leading-none tracking-[-0.05em] text-black [font-family:Georgia,serif] md:text-[24px]">
                Choose the clock.
              </h2>
              <p className="mt-1.5 max-w-[340px] text-[10px] leading-5 text-zinc-600">
                Duration changes both the timer and the style of the debate.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {DEBATE_DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDurationPreset(option.value)}
                    className={cn(
                      "flex min-h-[74px] w-full flex-col rounded-xl border px-3 py-2 text-left transition",
                      durationPreset === option.value
                        ? "border-black bg-black text-white"
                        : "border-zinc-200 bg-white text-black hover:border-zinc-400",
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
                          ? "text-zinc-300"
                          : "text-zinc-500",
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
              <h2 className="mt-1.5 text-[20px] leading-none tracking-[-0.05em] text-black [font-family:Georgia,serif] md:text-[24px]">
                Set the topic.
              </h2>
              <p className="mt-1.5 max-w-[340px] text-[10px] leading-5 text-zinc-600">
                Enter your own philosophy thesis or generate one.
              </p>

              <div className="mt-4">
                <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                  Debate topic
                </label>
                <textarea
                  value={topicInput}
                  onChange={(event) => {
                    setTopicInput(event.target.value);
                    setSelectedTopic("");
                    setError("");
                  }}
                  rows={4}
                  placeholder="Example: Moral progress is mostly a myth societies tell themselves."
                  className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-[11px] leading-5 text-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)] outline-none transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 placeholder:text-zinc-400"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleValidateCustomTopic()}
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-[10px] text-white transition hover:bg-zinc-800 disabled:opacity-60"
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
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[10px] text-zinc-700 transition hover:border-zinc-400 hover:text-black disabled:opacity-60"
                >
                  <Sparkles size={13} />
                  Generate topics
                </button>
              </div>

            </div>
          )}

          {step === "side" && (
            <div>
              <h2 className="mt-1.5 text-[20px] leading-none tracking-[-0.05em] text-black [font-family:Georgia,serif] md:text-[24px]">
                Choose your side.
              </h2>
              <p className="mt-1.5 max-w-[340px] text-[10px] leading-5 text-zinc-600">
                Pick whether you defend the thesis or attack it.
              </p>

              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                  Confirmed thesis
                </p>
                <p className="mt-2 text-[16px] leading-6 tracking-[-0.04em] text-black [font-family:Georgia,serif]">
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
                        ? "border-black bg-black text-white"
                        : "border-zinc-200 bg-white text-black hover:border-zinc-400",
                    )}
                  >
                    <div>
                      <p className="text-[12px] font-medium">{option.title}</p>
                      <p
                        className={cn(
                          "mt-1 text-[10px] leading-5",
                          userSide === option.value
                            ? "text-zinc-300"
                            : "text-zinc-500",
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

          {step === "reveal" && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-400">
                Topic Reveal
              </p>
              <motion.div
                initial={{ opacity: 0, scale: 0.97, filter: "blur(14px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4"
              >
                <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                  {revealSubtitle}
                </p>
                <h2 className="mt-2.5 text-[22px] leading-[1] tracking-[-0.06em] text-black [font-family:Georgia,serif] md:text-[28px]">
                  {topic}
                </h2>
                <p className="mt-3 max-w-[320px] text-[10px] leading-5 text-zinc-600">
                  You will enter on the side of{" "}
                  <span className="font-medium text-black">
                    {userSideLabel.toLowerCase()}
                  </span>
                  . Socratic AI will take the opposite side.
                </p>
              </motion.div>
            </div>
          )}

          {step === "ready" && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-400">
                Ready
              </p>
              <h2 className="mt-1.5 text-[20px] leading-none tracking-[-0.05em] text-black [font-family:Georgia,serif] md:text-[24px]">
                Ready to begin?
              </h2>
              <p className="mt-1.5 max-w-[340px] text-[10px] leading-5 text-zinc-600">
                Timed debates end permanently when the clock runs out.
              </p>

              <div className="mt-4 grid gap-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5 md:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                    Tone
                  </p>
                  <p className="mt-1.5 text-[12px] text-black">
                    {
                      DEBATE_TONE_OPTIONS.find((option) => option.value === tone)
                        ?.label
                    }
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                    Timing
                  </p>
                  <p className="mt-1.5 text-[12px] text-black">
                    {
                      DEBATE_DURATION_OPTIONS.find(
                        (option) => option.value === durationPreset,
                      )?.label
                    }
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                    Thesis
                  </p>
                  <p className="mt-1.5 text-[14px] leading-6 tracking-[-0.03em] text-black [font-family:Georgia,serif]">
                    {topic}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                    Your side
                  </p>
                  <p className="mt-1.5 text-[12px] text-black">
                    {userSideLabel}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                    AI side
                  </p>
                  <p className="mt-1.5 text-[12px] text-black">{aiSide}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {error && (
        <div className="mt-3 max-w-[460px] rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-left text-[10px] leading-5 text-zinc-700">
          {error}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {step !== "tone" && (
          <button
            type="button"
            onClick={goToPreviousStep}
            disabled={isBusy}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[10px] text-zinc-700 transition hover:border-zinc-400 hover:text-black disabled:opacity-60"
          >
            Back
          </button>
        )}

        {step === "tone" && (
          <button
            type="button"
            onClick={() => goToNextStep()}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-[10px] text-white transition hover:bg-zinc-800"
          >
            Continue
            <ArrowRight size={13} />
          </button>
        )}

        {step === "duration" && (
          <button
            type="button"
            onClick={() => goToNextStep()}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-[10px] text-white transition hover:bg-zinc-800"
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
            className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-[10px] text-white transition hover:bg-zinc-800 disabled:opacity-60"
          >
            Continue
            <ArrowRight size={13} />
          </button>
        )}

        {step === "side" && (
          <button
            type="button"
            onClick={() => goToNextStep("reveal")}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-[10px] text-white transition hover:bg-zinc-800"
          >
            Reveal topic
            <ArrowRight size={13} />
          </button>
        )}

        {step === "reveal" && (
          <button
            type="button"
            onClick={() => goToNextStep("ready")}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-[10px] text-white transition hover:bg-zinc-800"
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
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] text-white transition hover:bg-zinc-800 disabled:opacity-60"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/16 p-4 backdrop-blur-[2px]"
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
            className="w-full max-w-[360px] rounded-[9px] border border-[#C8C8C2] bg-white px-4 py-3.5 shadow-[0_14px_36px_rgba(15,23,42,0.14)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[22px] leading-none tracking-[-0.05em] text-black [font-family:Georgia,serif]">
                  Suggested topics
                </p>
                <p className="mt-1 text-[10px] leading-4 text-slate-500">
                  Pick one thesis to drop into the debate setup.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTopicSuggestionsDialog(false)}
                disabled={isBusy}
                className="cursor-pointer rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
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
                      ? "border-black bg-black text-white"
                      : "border-zinc-200 bg-white text-black hover:border-zinc-400",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p
                      className={cn(
                        "text-[9px] uppercase tracking-[0.18em]",
                        pendingSuggestedTopic === suggestion
                          ? "text-zinc-300"
                          : "text-zinc-500",
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
                className="cursor-pointer rounded-full border border-slate-300 px-3 py-1.5 text-[10px] text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
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
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-[10px] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
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
