import { NextResponse, type NextRequest } from "next/server";
import {
  DEV_USER_ID_COOKIE,
  DEV_USER_NAME_COOKIE,
  isDevAuthEnabled,
  sanitizeReturnPath,
} from "@/lib/auth/dev-session-shared";


/**
 * Next.js 16 Route Guard Proxy
 *
 * Enforces temporary development identity session before allowing access
 * to AccDoo CRM application routes. Redirects unauthenticated development visitors to /setup.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Bypass Next.js internal assets, dev-session API, and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/dev-session") ||
    pathname === "/favicon.ico" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Check if development authentication is enabled
  if (!isDevAuthEnabled()) {
    return NextResponse.next();
  }

  // 3. Inspect temporary dev session cookies
  const userId = request.cookies.get(DEV_USER_ID_COOKIE)?.value?.trim();
  const userName = request.cookies.get(DEV_USER_NAME_COOKIE)?.value?.trim();
  const hasSession = Boolean(userId && userName);

  // 4. Handle /setup onboarding route
  if (pathname === "/setup") {
    // If the developer already has a session, redirect to the intended destination or dashboard
    if (hasSession) {
      const nextParam = request.nextUrl.searchParams.get("next");
      const safeDestination = sanitizeReturnPath(nextParam);
      return NextResponse.redirect(new URL(safeDestination, request.url));
    }
    return NextResponse.next();
  }

  // 5. Gate all other application routes behind /setup
  if (!hasSession) {
    const setupUrl = new URL("/setup", request.url);
    const originalPath = pathname + (search || "");
    const safeNext = sanitizeReturnPath(originalPath);

    if (safeNext !== "/") {
      setupUrl.searchParams.set("next", safeNext);
    }

    return NextResponse.redirect(setupUrl);
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static assets)
     * - _next/image (image optimization)
     * - favicon.ico (browser icon)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
