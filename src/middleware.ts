import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Public marketing and curriculum routes must always resolve without auth.
 * Session-specific UI loads client-side via /api/auth/session.
 */
const PUBLIC_PREFIXES = [
  "/",
  "/learn",
  "/lesson",
  "/track",
  "/pricing",
  "/problems",
  "/lab",
  "/heat",
  "/diagnostic",
  "/blog",
  "/cheatsheets",
  "/search",
  "/privacy",
  "/terms",
  "/login",
  "/sandbox",
  "/sitemap.xml",
  "/robots.txt",
  "/opengraph-image",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    PUBLIC_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    ) || pathname.startsWith("/_next/");

  if (!isPublic && pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.headers.set("x-gofoundry-route", pathname);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|monitoring).*)",
  ],
};
