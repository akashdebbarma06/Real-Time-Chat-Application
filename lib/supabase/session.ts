import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Returns true if the request has a valid Supabase session.
 */
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Read-only check in request helper
        },
      },
    }
  );
  try {
    const { data } = await supabase.auth.getUser();
    return !!data.user?.id;
  } catch (e) {
    console.error("Auth check failed", e);
    return false;
  }
}

/**
 * Sets a session cookie with a short TTL (e.g., 30 minutes).
 */
export function setSessionCookie(response: NextResponse, sessionId: string, ttlMinutes = 30) {
  const expires = new Date(Date.now() + ttlMinutes * 60 * 1000);
  response.cookies.set("sb:session", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires,
    secure: process.env.NODE_ENV === "production",
  });
}

/**
 * Clears the session cookie.
 */
export function clearSessionCookie(response: NextResponse) {
  response.cookies.delete("sb:session");
}

/**
 * Helper to redirect unauthenticated users to login, preserving the original path.
 */
export function redirectToLogin(request: NextRequest, nextPath: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", nextPath);
  return NextResponse.redirect(url);
}

/**
 * Helper to redirect authenticated users away from auth pages.
 */
export function redirectIfAuthenticated(request: NextRequest, targetPath: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = targetPath;
  return NextResponse.redirect(url);
}

