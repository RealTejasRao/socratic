import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  getLocaleFromPathname,
} from "@/src/i18n/locales";

const PUBLIC_FILE_REGEX =
  /\.(?:avif|css|gif|ico|jpeg|jpg|js|json|map|png|svg|txt|webm|webp|woff|woff2|xml)$/i;
const APP_ROUTE_PREFIX = "/app";
const ANDROID_TWA_REFERRER_PREFIX = "android-app://";
const NON_CANONICAL_HOST = "usesocratic.com";
const CANONICAL_HOST = "www.usesocratic.com";
const TWA_LAUNCH_SEARCH_PARAM = "twa";
const AUTH_ROUTE_PREFIXES = ["/sign-in", "/sign-up", "/sso-callback"];
const LOCALE_HEADER = "x-socratic-locale";
const OAUTH_CALLBACK_SEARCH_PARAMS = [
  "__clerk_status",
  "__clerk_created_session",
  "__clerk_db_jwt",
  "code",
  "state",
  "ticket",
];

function normalizePathname(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

function matchesRoutePrefix(pathname: string, routePrefix: string): boolean {
  return pathname === routePrefix || pathname.startsWith(`${routePrefix}/`);
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTE_PREFIXES.some((routePrefix) =>
    matchesRoutePrefix(pathname, routePrefix),
  );
}

function hasOAuthCallbackSearchParams(req: NextRequest): boolean {
  return OAUTH_CALLBACK_SEARCH_PARAMS.some((searchParam) =>
    req.nextUrl.searchParams.has(searchParam),
  );
}

function isTwaLaunchRequest(req: NextRequest): boolean {
  const referrer = req.headers.get("referer") ?? "";

  return (
    req.nextUrl.searchParams.get(TWA_LAUNCH_SEARCH_PARAM) === "1" ||
    referrer.startsWith(ANDROID_TWA_REFERRER_PREFIX)
  );
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(LOCALE_HEADER, getLocaleFromPathname(pathname) ?? DEFAULT_LOCALE);
  const nextWithLocale = () =>
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  const isOAuthCallbackRequest =
    isAuthRoute(pathname) && hasOAuthCallbackSearchParams(req);
  const env = process.env["VERCEL_TARGET_ENV"] ?? process.env["VERCEL_ENV"];
  const isProduction = env === "production";
  const staticCanonicalRouteMap: Record<string, string> = {
    "/": "/",
    "/sign-in": "/sign-in",
    "/sign-up": "/sign-up",
  };

  if (!isProduction) {
    return nextWithLocale();
  }

  const requestHostHeader =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const requestHost = requestHostHeader.split(",")[0]?.trim().split(":")[0]?.toLowerCase();

  if (requestHost === NON_CANONICAL_HOST && !isOAuthCallbackRequest) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.hostname = CANONICAL_HOST;
    redirectUrl.protocol = "https";
    return NextResponse.redirect(redirectUrl, 308);
  }

  const normalizedPathname = normalizePathname(pathname);
  const lowerPathname = normalizedPathname.toLowerCase();
  const canonicalStaticPath = staticCanonicalRouteMap[lowerPathname];

  if (
    !isOAuthCallbackRequest &&
    canonicalStaticPath &&
    (pathname !== canonicalStaticPath || normalizedPathname !== canonicalStaticPath)
  ) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = canonicalStaticPath;
    return NextResponse.redirect(redirectUrl, 308);
  }

  if (pathname === "/") {
    return nextWithLocale();
  }

  if (isAuthRoute(pathname)) {
    return nextWithLocale();
  }

  if (pathname.startsWith("/api/webhooks/clerk")) {
    return nextWithLocale();
  }

  if (pathname.startsWith("/api/early-access")) {
    return nextWithLocale();
  }

  if (pathname.startsWith("/_next/")) {
    return nextWithLocale();
  }

  if (PUBLIC_FILE_REGEX.test(pathname)) {
    return nextWithLocale();
  }

  if (!matchesRoutePrefix(normalizedPathname, APP_ROUTE_PREFIX)) {
    return nextWithLocale();
  }

  const { userId } = await auth();

  if (userId) {
    return nextWithLocale();
  }

  if (isTwaLaunchRequest(req)) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  const redirectUrl = req.nextUrl.clone();
  redirectUrl.pathname = "/sign-in";
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
});

export const config = {
  matcher: ["/:path*"],
};
