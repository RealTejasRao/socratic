"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import type { Route } from "next";
import enAppCopy from "@/src/i18n/messages/en/app.json";
import type { AppCopy } from "@/src/i18n/app";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/src/i18n/locales";
import { ROUTES } from "@/src/lib/routes";
import type { SessionMode } from "@/src/types/chat";

type LegacyAppCopyOverrides = Partial<{
  emptySessionTitle: string;
  newChatLabel: string;
  searchChatsLabel: string;
  roleplayModeLabel: string;
  chatsHeading: string;
}>;

export type AppRouteCopyOverrides = Partial<AppCopy> & LegacyAppCopyOverrides;

type AppRouteContextValue = {
  appBasePath: string;
  marketingHomePath: Route;
  defaultNewChatMode: SessionMode;
  locale: SupportedLocale;
  copy: AppCopy;
};

const DEFAULT_APP_COPY = enAppCopy as AppCopy;

const AppRouteContext = createContext<AppRouteContextValue>({
  appBasePath: ROUTES.APP,
  marketingHomePath: ROUTES.HOME,
  defaultNewChatMode: "ROLEPLAY",
  locale: DEFAULT_LOCALE,
  copy: DEFAULT_APP_COPY,
});

export function AppRouteProvider({
  appBasePath = ROUTES.APP,
  marketingHomePath = ROUTES.HOME,
  defaultNewChatMode = "ROLEPLAY",
  locale = DEFAULT_LOCALE,
  copy,
  children,
}: {
  appBasePath?: string;
  marketingHomePath?: Route;
  defaultNewChatMode?: SessionMode;
  locale?: SupportedLocale;
  copy?: AppRouteCopyOverrides;
  children: React.ReactNode;
}) {
  const resolvedCopy = useMemo(() => {
    if (!copy) {
      return DEFAULT_APP_COPY;
    }

    const {
      emptySessionTitle,
      newChatLabel,
      searchChatsLabel,
      roleplayModeLabel,
      chatsHeading,
      ...copyOverrides
    } = copy;

    return {
      ...DEFAULT_APP_COPY,
      ...copyOverrides,
      nav: {
        ...DEFAULT_APP_COPY.nav,
        ...copyOverrides.nav,
        ...(emptySessionTitle === undefined ? {} : { emptySessionTitle }),
        ...(newChatLabel === undefined ? {} : { newChatLabel }),
        ...(searchChatsLabel === undefined ? {} : { searchChatsLabel }),
        ...(roleplayModeLabel === undefined ? {} : { roleplayModeLabel }),
        ...(chatsHeading === undefined ? {} : { chatsHeading }),
      },
    } as AppCopy;
  }, [copy]);

  return (
    <AppRouteContext.Provider
      value={{
        appBasePath,
        marketingHomePath,
        defaultNewChatMode,
        locale,
        copy: resolvedCopy,
      }}
    >
      {children}
    </AppRouteContext.Provider>
  );
}

export function useAppRoute() {
  const { appBasePath, marketingHomePath, defaultNewChatMode, locale, copy } =
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
    locale,
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
