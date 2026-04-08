import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_FILE_REGEX =
  /\.(?:avif|css|gif|ico|jpeg|jpg|js|json|map|png|svg|txt|webm|webp|woff|woff2|xml)$/i;

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const env = process.env["VERCEL_TARGET_ENV"] ?? process.env["VERCEL_ENV"];
  const isProduction = env === "production";

  if (!isProduction) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.next();
  }

  if (pathname === "/api/early-access") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  if (PUBLIC_FILE_REGEX.test(pathname)) {
    return NextResponse.next();
  }

  const redirectUrl = req.nextUrl.clone();
  redirectUrl.pathname = "/";
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/:path*"],
};
