import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessageCircleMore } from "lucide-react";
import { ProfileForm } from "@/components/profile/profile-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profile · Aether Chat" };

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const email = (claimsData?.claims?.email as string) || undefined;

  return (
    <main className="min-h-svh bg-[#0B0F17] text-slate-100 pb-12">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Button asChild variant="ghost" size="icon-sm" className="text-slate-300 hover:text-white">
            <Link href="/chat" aria-label="Back to chat">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
            <MessageCircleMore className="size-5" />
          </span>
          <span className="flex-1 font-bold text-lg tracking-wider uppercase bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Aether Chat
          </span>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md sm:p-8">
          <ProfileForm profile={profile} userEmail={email} />
        </div>
      </div>
    </main>
  );
}
