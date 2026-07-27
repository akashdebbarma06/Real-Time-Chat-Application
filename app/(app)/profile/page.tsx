import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessageCircleMore } from "lucide-react";
import { ProfileForm } from "@/components/profile/profile-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/current-user";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_20%_0%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_35%)]">
      <header className="border-b bg-background/85 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6"><Button asChild variant="ghost" size="icon-sm"><Link href="/chat" aria-label="Back to chat"><ArrowLeft /></Link></Button><span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><MessageCircleMore className="size-5" /></span><span className="flex-1 font-semibold">ChatSphere</span><ThemeToggle /></div></header>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14"><div className="mb-7"><p className="text-sm font-medium text-primary">Account</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Edit your profile</h1><p className="mt-2 text-sm text-muted-foreground">Keep your identity recognizable across direct messages and groups.</p></div><ProfileForm profile={profile} /></div>
    </main>
  );
}
