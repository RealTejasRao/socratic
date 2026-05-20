export const COOKIE_CONSENT_STORAGE_KEY = "socratic_cookie_consent_v1";
export const COOKIE_CONSENT_COOKIE_NAME = "socratic_cookie_consent";
export const COOKIE_CONSENT_VERSION = 1;
export const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const COOKIE_CONSENT_OPEN_EVENT = "socratic:cookie-consent-open";
export const COOKIE_CONSENT_UPDATED_EVENT = "socratic:cookie-consent-updated";

export type CookieConsentCategory =
  | "essential"
  | "performance"
  | "analytics"
  | "advertising"
  | "social"
  | "unclassified";

export type CookieConsentPreferences = Record<CookieConsentCategory, boolean>;

export type CookieConsentMethod = "accept_all" | "decline_all" | "save_preferences";

export type CookieConsentRecord = {
  version: number;
  updatedAt: string;
  method: CookieConsentMethod;
  preferences: CookieConsentPreferences;
};

export const COOKIE_CONSENT_DEFAULT_PREFERENCES: CookieConsentPreferences = {
  essential: true,
  performance: false,
  analytics: false,
  advertising: false,
  social: false,
  unclassified: false,
};

export const COOKIE_CONSENT_OPTIONAL_CATEGORIES: CookieConsentCategory[] = [
  "performance",
  "analytics",
  "advertising",
  "social",
  "unclassified",
];

function safeParseConsent(value: string): CookieConsentRecord | null {
  try {
    const parsed = JSON.parse(value) as Partial<CookieConsentRecord>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const preferences = parsed.preferences as Partial<CookieConsentPreferences> | undefined;
    if (!preferences) {
      return null;
    }

    return {
      version: Number(parsed.version) || COOKIE_CONSENT_VERSION,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
      method:
        parsed.method === "accept_all" ||
        parsed.method === "decline_all" ||
        parsed.method === "save_preferences"
          ? parsed.method
          : "save_preferences",
      preferences: {
        essential: true,
        performance: Boolean(preferences.performance),
        analytics: Boolean(preferences.analytics),
        advertising: Boolean(preferences.advertising),
        social: Boolean(preferences.social),
        unclassified: Boolean(preferences.unclassified),
      },
    };
  } catch {
    return null;
  }
}

function readConsentCookie(): CookieConsentRecord | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookiePrefix = `${COOKIE_CONSENT_COOKIE_NAME}=`;
  const cookieValue = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(cookiePrefix));

  if (!cookieValue) {
    return null;
  }

  const encodedValue = cookieValue.slice(cookiePrefix.length);
  const decodedValue = decodeURIComponent(encodedValue);
  return safeParseConsent(decodedValue);
}

function writeConsentCookie(record: CookieConsentRecord) {
  if (typeof document === "undefined") {
    return;
  }

  const encodedValue = encodeURIComponent(JSON.stringify(record));
  document.cookie = [
    `${COOKIE_CONSENT_COOKIE_NAME}=${encodedValue}`,
    `max-age=${COOKIE_CONSENT_MAX_AGE_SECONDS}`,
    "path=/",
    "samesite=lax",
  ].join(";");
}

export function readStoredCookieConsent(): CookieConsentRecord | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  if (storedValue) {
    const parsed = safeParseConsent(storedValue);
    if (parsed) {
      return parsed;
    }
  }

  return readConsentCookie();
}

export function hasCookieConsentDecision(): boolean {
  return Boolean(readStoredCookieConsent());
}

export function isCookieCategoryAllowed(category: CookieConsentCategory): boolean {
  if (category === "essential") {
    return true;
  }

  const consent = readStoredCookieConsent();
  if (!consent) {
    return false;
  }

  return Boolean(consent.preferences[category]);
}

export function createCookieConsentRecord(
  preferences: CookieConsentPreferences,
  method: CookieConsentMethod,
): CookieConsentRecord {
  return {
    version: COOKIE_CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
    method,
    preferences: {
      ...COOKIE_CONSENT_DEFAULT_PREFERENCES,
      ...preferences,
      essential: true,
    },
  };
}

export function persistCookieConsent(record: CookieConsentRecord) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(record));
  writeConsentCookie(record);
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_UPDATED_EVENT, { detail: record }));
}

export function openCookieConsentPreferences() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(COOKIE_CONSENT_OPEN_EVENT));
}
