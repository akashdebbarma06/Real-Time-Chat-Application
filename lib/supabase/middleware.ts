import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { getPublicSupabaseKey, getPublicSupabaseUrl } from "@/lib/supabase/config";
import { logServerError } from "@/lib/logger";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    getPublicSupabaseUrl(),
    getPublicSupabaseKey(),
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          } catch (error) {
            logServerError(error, "Failed to set cookies in middleware session update");
          }
        },
      },
    },
  );

  try {
    const { data } = await supabase.auth.getClaims();
    const isAuthenticated = Boolean(data?.claims?.sub);
    const path = request.nextUrl.pathname;
    const isAuthRoute = path.startsWith("/login") || path.startsWith("/signup");
    const isProtectedRoute = path.startsWith("/chat") || path.startsWith("/profile");

    if (!isAuthenticated && isProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }

    if (isAuthenticated && isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/chat";
      return NextResponse.redirect(url);
    }

    return response;
  } catch (error) {
    logServerError(error, "Auth session validation failed in middleware");
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
