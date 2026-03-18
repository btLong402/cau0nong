import { type NextRequest, NextResponse } from "next/server";

/**
 * Proxy for route-level authentication checks.
 * Public routes are always accessible.
 * Private routes require the auth token cookie set at login.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicRoutes = new Set(["/login", "/register"]);
  const isPublicRoute = publicRoutes.has(pathname);
  const isApiRoute = pathname.startsWith("/api/");
  const isNextInternal = pathname.startsWith("/_next/");
  const isPublicFile = /\.[^/]+$/.test(pathname);

  // API routes apply auth at handler level, not in proxy.
  if (isPublicRoute || isApiRoute || isNextInternal || isPublicFile) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect all routes except /login, /register, and public assets
    "/((?!_next/static|_next/image|favicon.ico|login|register).*)",
  ],
};
