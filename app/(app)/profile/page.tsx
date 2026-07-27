import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessageCircleMore } from "lucide-react";
import { ProfileForm } from "@/components/profile/profile-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const email = (claimsData?.claims?.email as string) || undefined;

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_20%_0%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_35%)] pb-12">
      <header className="border-b bg-background/85 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Button asChild variant="ghost" size="icon-sm">
            <Link href="/chat" aria-label="Back to chat">
              <ArrowLeft />
            </Link>
          </Button>
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <MessageCircleMore className="size-5" />
          </span>
          <span className="flex-1 font-semibold text-lg">ChatSphere</span>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-3xl border bg-card p-6 shadow-2xl shadow-black/5 sm:p-8">
          <ProfileForm profile={profile} userEmail={email} />
        </div>
      </div>
    </main>
  );
}
