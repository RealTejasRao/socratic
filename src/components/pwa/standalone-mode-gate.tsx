"use client";

import type { ReactNode } from "react";

type StandaloneModeGateProps = {
  browser: ReactNode;
  standalone: ReactNode;
};

export function StandaloneModeGate({
  browser,
  standalone,
}: StandaloneModeGateProps) {
  return (
    <>
      <div className="pwa-browser-only">{browser}</div>
      <div className="pwa-standalone-only">{standalone}</div>
    </>
  );
}
