"use client";

import { useEffect, useState } from "react";
import { detectStandaloneMode } from "@/src/lib/pwa-standalone";

function readStandaloneFromDom() {
  if (typeof document === "undefined") {
    return false;
  }

  if (document.documentElement.dataset["displayMode"] === "standalone") {
    return true;
  }

  if (document.documentElement.dataset["displayMode"] === "browser") {
    return false;
  }

  return detectStandaloneMode(window);
}

export function useStandaloneMode() {
  const [isStandalone, setIsStandalone] = useState<boolean>(() =>
    readStandaloneFromDom(),
  );

  useEffect(() => {
    const updateStandaloneMode = () => {
      const nextIsStandalone = detectStandaloneMode(window);
      document.documentElement.dataset["displayMode"] = nextIsStandalone
        ? "standalone"
        : "browser";
      document.documentElement.classList.toggle("pwa-standalone", nextIsStandalone);
      setIsStandalone(nextIsStandalone);
    };

    updateStandaloneMode();

    const displayModeMedia = window.matchMedia("(display-mode: standalone)");
    const fullscreenMedia = window.matchMedia("(display-mode: fullscreen)");

    if (displayModeMedia.addEventListener) {
      displayModeMedia.addEventListener("change", updateStandaloneMode);
      fullscreenMedia.addEventListener("change", updateStandaloneMode);
    } else {
      displayModeMedia.addListener(updateStandaloneMode);
      fullscreenMedia.addListener(updateStandaloneMode);
    }
    window.addEventListener("focus", updateStandaloneMode);
    document.addEventListener("visibilitychange", updateStandaloneMode);

    return () => {
      if (displayModeMedia.removeEventListener) {
        displayModeMedia.removeEventListener("change", updateStandaloneMode);
        fullscreenMedia.removeEventListener("change", updateStandaloneMode);
      } else {
        displayModeMedia.removeListener(updateStandaloneMode);
        fullscreenMedia.removeListener(updateStandaloneMode);
      }
      window.removeEventListener("focus", updateStandaloneMode);
      document.removeEventListener("visibilitychange", updateStandaloneMode);
    };
  }, []);

  return isStandalone;
}
