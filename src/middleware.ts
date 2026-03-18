import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/**
 * Middleware for authentication & session check
 * Validates Supabase session from cookies
 * Redirects unauthenticated users to login
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes that don't require authentication
  const publicRoutes = ["/login", "/register", "/"];
  
  // Allow all /api routes through (they handle auth themselves)
  const isApiRoute = pathname.startsWith("/api/");

  // Check if route requires auth
  const isPublicRoute = publicRoutes.includes(pathname) || isApiRoute;

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, verify session
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getSession();

  if (error || !data?.session) {
    // No session, redirect to login
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
