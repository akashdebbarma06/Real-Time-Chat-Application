import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircleMore, ShieldCheck, Zap, Users, Lock, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about ChatSphere, a secure realtime collaboration and messaging platform.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Hero Section */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3.5 py-1.5 text-xs font-medium text-primary">
          <MessageCircleMore className="size-3.5" /> About ChatSphere
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Realtime Messaging Built for Modern Teams & Friends
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          ChatSphere is designed from the ground up for seamless, secure, and instant communication across web and mobile platforms.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/signup">Get Started Free</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/contact">Get in Touch</Link>
          </Button>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <Zap className="size-8 text-primary mb-4" />
          <h3 className="text-lg font-semibold">Lightning Fast</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Realtime WebSocket infrastructure powered by Supabase Broadcast channels for sub-millisecond message delivery.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <Lock className="size-8 text-primary mb-4" />
          <h3 className="text-lg font-semibold">Privacy First</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Database Row Level Security (RLS) guarantees that only authorized conversation members can read or write messages.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <Radio className="size-8 text-primary mb-4" />
          <h3 className="text-lg font-semibold">Live Presence</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Know when your friends are online, active, or typing in real time without unnecessary server overhead.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <Users className="size-8 text-primary mb-4" />
          <h3 className="text-lg font-semibold">Group Channels</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Create 1-on-1 direct messages or multi-user group spaces with custom avatars, titles, and member roles.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <ShieldCheck className="size-8 text-primary mb-4" />
          <h3 className="text-lg font-semibold">Secure File Sharing</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Share images, documents, and media safely with signed URL authorization and strict storage access policies.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <MessageCircleMore className="size-8 text-primary mb-4" />
          <h3 className="text-lg font-semibold">Cross-Platform</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Available on Web, Progressive Web App (PWA), and native Android APK with synchronized notifications.
          </p>
        </div>
      </div>
    </div>
  );
}
