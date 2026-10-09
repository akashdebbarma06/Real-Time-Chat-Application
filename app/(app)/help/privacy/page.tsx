export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { InAppPrivacyView } from "@/components/help/in-app-privacy-view";

export const metadata: Metadata = {
  title: "Privacy & Data Protection",
  description: "Manage your data, review security safeguards, and export your Aether account history.",
};

export default async function HelpPrivacyPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const email = (claimsData?.claims?.email as string) || undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <InAppPrivacyView profile={profile} userEmail={email} />
    </div>
  );
}
