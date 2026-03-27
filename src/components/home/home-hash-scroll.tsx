"use client";

import { useEffect } from "react";

const MAX_RETRIES = 18;
const RETRY_MS = 80;

function scrollToCurrentHash(behavior: ScrollBehavior): boolean {
  if (typeof window === "undefined") return false;
  const rawHash = window.location.hash;
  if (!rawHash) return false;

  const id = decodeURIComponent(rawHash.slice(1));
  if (!id) return false;

  const target = document.getElementById(id);
  if (!target) return false;

  target.scrollIntoView({ behavior, block: "start" });
  return true;
}

export function HomeHashScroll() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const initialBehavior: ScrollBehavior = prefersReducedMotion
      ? "auto"
      : "smooth";

    let tries = 0;
    const intervalId = window.setInterval(() => {
      tries += 1;
      const didScroll = scrollToCurrentHash(initialBehavior);
      if (didScroll || tries >= MAX_RETRIES) {
        window.clearInterval(intervalId);
      }
    }, RETRY_MS);

    const onHashChange = () => {
      scrollToCurrentHash(prefersReducedMotion ? "auto" : "smooth");
    };

    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  return null;
}
