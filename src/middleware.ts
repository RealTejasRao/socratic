import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_FILE_REGEX =
  /\.(?:avif|css|gif|ico|jpeg|jpg|js|json|map|png|svg|txt|webm|webp|woff|woff2|xml)$/i;
const APP_ROUTE_PREFIX = "/app";

function normalizePathname(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

function matchesRoutePrefix(pathname: string, routePrefix: string): boolean {
  return pathname === routePrefix || pathname.startsWith(`${routePrefix}/`);
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;
  const env = process.env["VERCEL_TARGET_ENV"] ?? process.env["VERCEL_ENV"];
  const isProduction = env === "production";
  const staticCanonicalRouteMap: Record<string, string> = {
    "/": "/",
    "/sign-in": "/sign-in",
    "/sign-up": "/sign-up",
  };

  if (!isProduction) {
    return NextResponse.next();
  }

  const normalizedPathname = normalizePathname(pathname);
  const lowerPathname = normalizedPathname.toLowerCase();
  const canonicalStaticPath = staticCanonicalRouteMap[lowerPathname];

  if (
    canonicalStaticPath &&
    (pathname !== canonicalStaticPath || normalizedPathname !== canonicalStaticPath)
  ) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = canonicalStaticPath;
    return NextResponse.redirect(redirectUrl, 308);
  }

  if (pathname === "/") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/sign-in")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/webhooks/clerk")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/early-access")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  if (PUBLIC_FILE_REGEX.test(pathname)) {
    return NextResponse.next();
  }

  if (!matchesRoutePrefix(normalizedPathname, APP_ROUTE_PREFIX)) {
    return NextResponse.next();
  }

  const { userId } = await auth();

  if (userId) {
    return NextResponse.next();
  }

  const redirectUrl = req.nextUrl.clone();
  redirectUrl.pathname = "/sign-in";
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
});

export const config = {
  matcher: ["/:path*"],
};
