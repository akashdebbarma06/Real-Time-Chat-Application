export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { InAppContactForm } from "@/components/help/in-app-contact-form";

export const metadata: Metadata = {
  title: "Contact Support",
  description: "Reach our priority in-app support desk for feedback, bug reports, and account help.",
};

export default async function HelpContactPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const email = (claimsData?.claims?.email as string) || undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <InAppContactForm profile={profile} userEmail={email} />
    </div>
  );
}
