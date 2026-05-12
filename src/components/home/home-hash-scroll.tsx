"use client";

import { useEffect } from "react";
import {
  HOME_HERO_EMAIL_FOCUS_EVENT,
  HOME_HERO_HASH,
} from "@/src/lib/home-hero";

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

function requestHeroEmailFocusForHash() {
  if (typeof window === "undefined") return;
  if (window.location.hash !== HOME_HERO_HASH) return;
  window.dispatchEvent(new CustomEvent(HOME_HERO_EMAIL_FOCUS_EVENT));
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
        requestHeroEmailFocusForHash();
        window.clearInterval(intervalId);
      }
    }, RETRY_MS);

    const onHashChange = () => {
      scrollToCurrentHash(prefersReducedMotion ? "auto" : "smooth");
      requestHeroEmailFocusForHash();
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

      if (href === HOME_HERO_HASH) {
        window.dispatchEvent(new CustomEvent(HOME_HERO_EMAIL_FOCUS_EVENT));
        return;
      }

      if (href === "#contact") {
        window.dispatchEvent(
          new CustomEvent("section:typewriter:restart", {
            detail: { sectionId: "contact" },
          })
        );
        return;
      }

      if (href === "#use-cases") {
        window.dispatchEvent(
          new CustomEvent("section:typewriter:restart", {
            detail: { sectionId: "use-cases" },
          })
        );
        return;
      }

      if (href === "#features") {
        window.dispatchEvent(
          new CustomEvent("section:typewriter:restart", {
            detail: { sectionId: "features" },
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
