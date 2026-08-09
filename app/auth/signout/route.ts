import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    logServerError(error, "Sign-out action failed");
  }

  const url = new URL("/login", request.url);
  return NextResponse.redirect(url, { status: 303 });
}
