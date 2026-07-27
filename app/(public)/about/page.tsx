import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircleMore, ShieldCheck, Zap, Users, Lock, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Aether Chat",
  description: "Learn about Aether Chat, a secure realtime collaboration and messaging platform.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 text-slate-100">
      {/* Hero Section */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-400">
          <MessageCircleMore className="size-3.5" /> About Aether Chat
        </span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Next-Gen Realtime Messaging Built for Teams & Friends
        </h1>
        <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Aether Chat is designed from the ground up for seamless, secure, and instant communication across web and mobile platforms.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild size="lg" className="rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
            <Link href="/signup">Get Started Free</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800">
            <Link href="/contact">Get in Touch</Link>
          </Button>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md">
          <Zap className="size-8 text-cyan-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-100">Lightning Fast</h3>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Realtime WebSocket infrastructure powered by Supabase Broadcast channels for sub-millisecond message delivery.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md">
          <Lock className="size-8 text-cyan-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-100">Privacy First</h3>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Database Row Level Security (RLS) guarantees that only authorized conversation members can read or write messages.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md">
          <Radio className="size-8 text-cyan-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-100">Live Presence</h3>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Know when your friends are online, active, or typing in real time without unnecessary server overhead.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md">
          <Users className="size-8 text-cyan-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-100">Group Channels</h3>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Create 1-on-1 direct messages or multi-user group spaces with custom avatars, titles, and member roles.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md">
          <ShieldCheck className="size-8 text-cyan-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-100">Secure File Sharing</h3>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Share images, documents, and media safely with signed URL authorization and strict storage access policies.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md">
          <MessageCircleMore className="size-8 text-cyan-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-100">Cross-Platform</h3>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Available on Web, Progressive Web App (PWA), and native Android APK with synchronized notifications.
          </p>
        </div>
      </div>
    </div>
  );
}
