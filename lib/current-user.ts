import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/chat";

export const getCurrentProfile = cache(async (): Promise<Profile> => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId || typeof userId !== "string") redirect("/login");

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, last_seen_at")
    .eq("id", userId)
    .single();

  if (error || !data) redirect("/login");
  return data as Profile;
});
