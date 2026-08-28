"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import type { Route } from "next";
import { ROUTES } from "@/src/lib/routes";
import type { SessionMode } from "@/src/types/chat";

type AppRouteContextValue = {
  appBasePath: string;
  marketingHomePath: Route;
  defaultNewChatMode: SessionMode;
  copy: {
    emptySessionTitle: string;
    newChatLabel: string;
    searchChatsLabel: string;
    roleplayModeLabel: string;
    chatsHeading: string;
  };
};

const DEFAULT_APP_COPY: AppRouteContextValue["copy"] = {
  emptySessionTitle: "Start of a new conversation",
  newChatLabel: "New Chat",
  searchChatsLabel: "Search chats",
  roleplayModeLabel: "Talk to a philosopher",
  chatsHeading: "Chats",
};

const AppRouteContext = createContext<AppRouteContextValue>({
  appBasePath: ROUTES.APP,
  marketingHomePath: ROUTES.HOME,
  defaultNewChatMode: "ROLEPLAY",
  copy: DEFAULT_APP_COPY,
});

export function AppRouteProvider({
  appBasePath = ROUTES.APP,
  marketingHomePath = ROUTES.HOME,
  defaultNewChatMode = "ROLEPLAY",
  copy,
  children,
}: {
  appBasePath?: string;
  marketingHomePath?: Route;
  defaultNewChatMode?: SessionMode;
  copy?: Partial<AppRouteContextValue["copy"]>;
  children: React.ReactNode;
}) {
  const resolvedCopy = useMemo(
    () => ({ ...DEFAULT_APP_COPY, ...copy }),
    [copy],
  );

  return (
    <AppRouteContext.Provider
      value={{
        appBasePath,
        marketingHomePath,
        defaultNewChatMode,
        copy: resolvedCopy,
      }}
    >
      {children}
    </AppRouteContext.Provider>
  );
}

export function useAppRoute() {
  const { appBasePath, marketingHomePath, defaultNewChatMode, copy } =
    useContext(AppRouteContext);

  const escapedBasePath = useMemo(
    () => appBasePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    [appBasePath],
  );
  const sessionHref = useCallback(
    (sessionId: string) => `${appBasePath}/${sessionId}` as Route,
    [appBasePath],
  );
  const sessionSummaryHref = useCallback(
    (sessionId: string) => `${appBasePath}/${sessionId}/summary` as Route,
    [appBasePath],
  );
  const modeHref = useCallback(
    (mode: "socratic" | "debate" | "roleplay") =>
      `${appBasePath}?mode=${mode}` as Route,
    [appBasePath],
  );
  const newChatHref = useMemo(
    () =>
      modeHref(
        defaultNewChatMode.toLowerCase() as "socratic" | "debate" | "roleplay",
      ),
    [defaultNewChatMode, modeHref],
  );
  const roleplayPhilosopherHref = useCallback(
    (philosopherId: string) =>
      `${appBasePath}?mode=roleplay&philosopher=${encodeURIComponent(
        philosopherId,
      )}` as Route,
    [appBasePath],
  );
  const draftKey = useCallback(
    (sessionId?: string) =>
      sessionId
        ? `socratic:draft:${appBasePath}/${sessionId}`
        : `socratic:draft:${appBasePath}`,
    [appBasePath],
  );
  const isAppRoot = useCallback(
    (pathname: string) => pathname === appBasePath,
    [appBasePath],
  );
  const isSessionPath = useCallback(
    (pathname: string, sessionId: string) =>
      pathname === `${appBasePath}/${sessionId}`,
    [appBasePath],
  );
  const matchSessionPath = useCallback(
    (pathname: string) => pathname.match(new RegExp(`^${escapedBasePath}/([^/]+)$`)),
    [escapedBasePath],
  );
  const contactHref = `${marketingHomePath}#contact` as Route;

  return {
    appBasePath,
    marketingHomePath,
    defaultNewChatMode,
    copy,
    contactHref,
    sessionHref,
    sessionSummaryHref,
    modeHref,
    newChatHref,
    roleplayPhilosopherHref,
    draftKey,
    isAppRoot,
    isSessionPath,
    matchSessionPath,
  };
}
