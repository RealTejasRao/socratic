"use client";

import { useSyncExternalStore } from "react";

type LoadGateProps = {
  children: React.ReactNode;
  fallbackClassName?: string;
};

function subscribeToHydration(onStoreChange: () => void) {
  onStoreChange();
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function LoadGate({
  children,
  fallbackClassName = "min-h-screen w-full bg-white",
}: LoadGateProps) {
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot,
  );

  if (!isHydrated) {
    return <div className={fallbackClassName} aria-hidden="true" />;
  }

  return <>{children}</>;
}
