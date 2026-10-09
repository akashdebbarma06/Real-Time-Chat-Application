import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { redirectToLogin, redirectIfAuthenticated, setSessionCookie } from "./session";

/**
 * Handles authentication redirects for protected and auth routes.
 */
export function handleAuthRedirects(request: NextRequest, isAuthenticatedUser: boolean): NextResponse | null {
  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/login") || path.startsWith("/signup");
  const isProtectedRoute =
    path.startsWith("/chat") || path.startsWith("/profile") || path.startsWith("/help");

  // Unauthenticated users attempting to reach a protected route are sent to login
  if (!isAuthenticatedUser && isProtectedRoute) {
    return redirectToLogin(request, path);
  }

  // Authenticated users visiting login or signup pages are sent to the main chat
  if (isAuthenticatedUser && isAuthRoute) {
    return redirectIfAuthenticated(request, "/chat");
  }

  // Authenticated users accessing external contact or privacy are routed to dedicated in-app pages
  if (isAuthenticatedUser && !request.nextUrl.searchParams.has("public")) {
    if (path === "/contact") {
      const url = request.nextUrl.clone();
      url.pathname = "/help/contact";
      return NextResponse.redirect(url);
    }
    if (path === "/privacy") {
      const url = request.nextUrl.clone();
      url.pathname = "/help/privacy";
      return NextResponse.redirect(url);
    }
  }

  return null;
}

/**
 * Middleware to update Supabase session and enforce route protection.
 *
 * - Sets a short‑lived session cookie (30 min) on successful authentication.
 * - Redirects unauthenticated users trying to access protected routes (/chat, /profile) to /login.
 * - Redirects authenticated users away from auth pages (/login, /signup) to /chat.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  let userId: string | null = null;
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id || null;
  } catch (e) {
    console.error("Failed to retrieve Supabase user in middleware", e);
  }

  const authenticated = !!userId;
  const redirectResponse = handleAuthRedirects(request, authenticated);
  if (redirectResponse) {
    return redirectResponse;
  }

  if (authenticated && userId) {
    setSessionCookie(response, userId);
  }

  return response;
}

