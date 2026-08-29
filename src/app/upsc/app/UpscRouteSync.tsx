"use client";

import { useEffect } from "react";

const UPSC_APP_PATH = "/upsc/app";
const TOUR_TEXT_OVERRIDES: Record<string, { title?: string; detail?: string }> = {
  Socratic: {
    detail:
      "Specially designed to make you think and reason better. Build stronger, balanced answers by mastering every side of a question.",
  },
  Debate: {
    detail:
      "Become a master of arguments, counter arguments and rebuttals for Essay, GS and the Personality Test.",
  },
  Roleplay: {
    detail:
      "Learn justice, morality, duty etc. directly from history's greatest thinkers.",
  },
  "Switch modes": {
    detail:
      "Switch modes from the top dropdown or the sidebar shortcuts for Socratic, Debate, and Ethics with Thinkers.",
  },
};
const TOUR_STEP_LABEL_OVERRIDES: Record<string, string> = {
  Roleplay: "Ethics with Thinkers",
};

function isPrimaryClick(event: MouseEvent) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export default function UpscRouteSync() {
  useEffect(() => {
    function applyQuickTourCopyOverrides() {
      const tourCard = document.querySelector<HTMLElement>(".app-tour-card");
      if (!tourCard || !window.location.pathname.startsWith(UPSC_APP_PATH)) {
        return;
      }

      const heading = tourCard.querySelector<HTMLHeadingElement>("h2");
      const detail = tourCard.querySelector<HTMLParagraphElement>("p");
      const headingText = heading?.textContent?.trim();

      if (heading && headingText) {
        const override = TOUR_TEXT_OVERRIDES[headingText];

        if (override?.title && heading.textContent !== override.title) {
          heading.textContent = override.title;
        }

        if (detail && override?.detail && detail.textContent !== override.detail) {
          detail.textContent = override.detail;
        }
      }

      tourCard
        .querySelectorAll<HTMLSpanElement>("button span.relative.leading-3\\.5")
        .forEach((label) => {
          const nextLabel =
            TOUR_STEP_LABEL_OVERRIDES[label.textContent?.trim() ?? ""];

          if (nextLabel && label.textContent !== nextLabel) {
            label.textContent = nextLabel;
          }
        });
    }

    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(applyQuickTourCopyOverrides);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    applyQuickTourCopyOverrides();

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || !isPrimaryClick(event)) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link) {
        return;
      }

      const href = new URL(link.href);
      const isNewPracticeHref =
        href.origin === window.location.origin &&
        href.pathname === UPSC_APP_PATH;
      const isPracticeSessionPath =
        window.location.pathname.startsWith(`${UPSC_APP_PATH}/`);

      if (!isNewPracticeHref || !isPracticeSessionPath) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      window.history.pushState(null, "", `${UPSC_APP_PATH}?mode=socratic`);
      window.dispatchEvent(new CustomEvent("socratic:new-chat:requested"));
    }

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return null;
}
