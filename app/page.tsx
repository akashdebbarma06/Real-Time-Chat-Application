export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/logger";

export default async function HomePage() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    redirect(data?.claims?.sub ? "/chat" : "/login");
  } catch (error) {
    logServerError(error, "Failed to resolve home route authentication");
    redirect("/login");
  }
}
