import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_EXACT_PATHS = new Set([
  "/",
  "/api/early-access",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
]);

const ALLOWED_PREFIX_PATHS = [
  "/_next",
  "/brand",
  "/favicon",
  "/instruction",
  "/media",
  "/philosophers",
  "/waitlist",
];

const PUBLIC_FILE_REGEX =
  /\.(?:avif|css|gif|ico|jpeg|jpg|js|json|map|png|svg|txt|webm|webp|woff|woff2|xml)$/i;

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (ALLOWED_EXACT_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (
    ALLOWED_PREFIX_PATHS.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_FILE_REGEX.test(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const redirectUrl = req.nextUrl.clone();
  redirectUrl.pathname = "/";
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/:path*"],
};
