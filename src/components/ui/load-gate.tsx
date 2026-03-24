"use client";

import { useEffect, useState } from "react";

type LoadGateProps = {
  children: React.ReactNode;
  fallbackClassName?: string;
};

export function LoadGate({ children, fallbackClassName }: LoadGateProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const waitForLoad = async () => {
      if (document.readyState !== "complete") {
        await new Promise<void>((resolve) => {
          const onLoad = () => {
            window.removeEventListener("load", onLoad);
            resolve();
          };
          window.addEventListener("load", onLoad);
        });
      }

      if ("fonts" in document) {
        try {
          await (document as Document & { fonts: { ready: Promise<void> } }).fonts.ready;
        } catch {
          // Ignore fonts API failures and continue.
        }
      }

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      if (!cancelled) {
        setReady(true);
      }
    };

    void waitForLoad();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div
        className={fallbackClassName ?? "min-h-screen w-full bg-white"}
        aria-hidden="true"
      />
    );
  }

  return <>{children}</>;
}
