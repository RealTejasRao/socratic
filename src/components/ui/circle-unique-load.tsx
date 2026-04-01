"use client";
import React from "react";
import { PlusIcon } from "lucide-react";

const LOADING_STEPS = [
  { state: "_", label: "Fetching" },
  { state: "__", label: "Thinking" },
  { state: ".", label: "Reasoning" },
  { state: "..", label: "Questioning" },
  { state: "...", label: "Examining" },
  { state: "_", label: "Explaining" },
] as const;

type loadingProps = {
  screenHFull?: boolean;
  compact?: boolean;
};

export function Loading({ screenHFull = true, compact = false }: loadingProps) {
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const currentStep = LOADING_STEPS[currentStepIndex] ?? LOADING_STEPS[0];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex(
        (prevIndex) => (prevIndex + 1) % LOADING_STEPS.length,
      );
    }, 700);

    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
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

    return () => observer.disconnect();
  }, []);

  const textClass = isDarkMode
    ? "text-[rgba(241,241,239,0.9)]"
    : "text-[color:rgba(35,48,52,0.92)]";

  const stateClass = isDarkMode
    ? "text-[rgba(99,204,202,0.72)]"
    : "text-[color:rgba(66,133,140,0.82)]";

  const outerRingStyle = {
    borderColor: isDarkMode ? "rgba(255, 255, 255, 0.35)" : "rgba(35, 48, 52, 0.72)",
    backgroundColor: "transparent",
  } as const;

  const innerRingStyle = {
    borderColor: isDarkMode
      ? "rgba(99, 204, 202, 0.48)"
      : "rgba(35, 48, 52, 0.82)",
    color: isDarkMode ? "rgba(232, 236, 236, 0.92)" : "rgba(35, 48, 52, 0.94)",
    backgroundColor: "transparent",
  } as const;

  return (
    <div
      className={`${screenHFull ? "min-h-screen" : ""} relative inline-flex flex-col items-center justify-center`}
    >
      <div
        className={`${compact ? "border p-0.5" : "border-[1.5px] p-1.5"} rounded-full bg-transparent`}
        style={outerRingStyle}
      >
        <div
          className={`${compact ? "h-6 w-6 border" : "h-16 w-16 border-[1.5px]"} flex items-center justify-center rounded-full border border-dashed bg-transparent animate-spin`}
          style={innerRingStyle}
        >
          <PlusIcon size={compact ? 10 : 18} />
        </div>
      </div>

      <p
        className={`${compact ? "mt-1 text-[8px] tracking-[0.16em]" : "mt-3 text-sm tracking-[0.22em]"} text-center uppercase ${textClass}`}
        style={{ fontFamily: "Poppins, Arial, sans-serif" }}
      >
        {currentStep.label}
        <span className={`ml-1 opacity-80 ${stateClass}`}>
          {currentStep.state}
        </span>
      </p>
    </div>
  );
}
