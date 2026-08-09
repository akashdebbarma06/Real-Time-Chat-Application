import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Sign-out action failed", error);
  }

  const url = new URL("/login", request.url);
  return NextResponse.redirect(url, { status: 303 });
}
