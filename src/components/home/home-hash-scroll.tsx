"use client";

import { useEffect } from "react";

const MAX_RETRIES = 18;
const RETRY_MS = 80;

function replayHeroLoadAnimation() {
  const targets = document.querySelectorAll<HTMLElement>(".hero-load-up");
  targets.forEach((element) => {
    element.style.animation = "none";
  });

  // Force reflow so the browser treats the next assignment as a new animation run.
  void document.body.offsetHeight;

  targets.forEach((element) => {
    element.style.removeProperty("animation");
  });
}

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

    const onHashLinkClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;

      const anchor = target.closest("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href")?.trim();
      if (!href) return;

      if (href === "#") {
        replayHeroLoadAnimation();
        return;
      }

      if (href === "#contact") {
        window.dispatchEvent(
          new CustomEvent("section:typewriter:restart", {
            detail: { sectionId: "contact" },
          })
        );
      }
    };

    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("click", onHashLinkClick);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("click", onHashLinkClick);
    };
  }, []);

  return null;
}
