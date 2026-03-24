"use client";

import { useEffect, useState } from "react";

type TypewriterHeadingProps = {
  text: string;
  className?: string;
  speedMs?: number;
};

export function TypewriterHeading({
  text,
  className,
  speedMs = 58,
}: TypewriterHeadingProps) {
  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setVisibleChars((count) => {
        if (count >= text.length) {
          window.clearInterval(interval);
          return count;
        }
        return count + 1;
      });
    }, speedMs);

    return () => window.clearInterval(interval);
  }, [text, speedMs]);

  return (
    <span className={className}>
      {text.slice(0, visibleChars)}
      <span className="hero-caret" aria-hidden="true" />
    </span>
  );
}
