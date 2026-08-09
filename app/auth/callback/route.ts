import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  const next = requestedNext?.startsWith("/") ? requestedNext : "/chat";

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const baseUrl = host && !host.includes("localhost") ? `${proto}://${host}` : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", baseUrl));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("OAuth callback session exchange failed", error);
      return NextResponse.redirect(new URL("/login?error=callback", baseUrl));
    }

    return NextResponse.redirect(new URL(next, baseUrl));
  } catch (error) {
      console.error("Unhandled exception in OAuth callback", error);
    return NextResponse.redirect(new URL("/login?error=callback", baseUrl));
  }
}
