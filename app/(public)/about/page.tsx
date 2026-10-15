import type { Metadata } from "next";
import Link from "next/link";
import {
  MessageCircleMore,
  ShieldCheck,
  Zap,
  Users,
  Lock,
  Radio,
  Download,
  ExternalLink,
  Code2,
  FileText,
  AlertTriangle,
  Globe,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Aether Chat",
  description: "Learn about Aether Chat — a modern, local-first real-time messaging engine built for teams, friends, and communities.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 text-slate-100">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-400">
          <MessageCircleMore className="size-3.5" /> About Aether Chat
        </span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Modern Real-Time Messaging Built with Integrity
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
          Aether Chat is an open-source, full-stack communication platform combining instant WebSocket messaging, PostgreSQL Row Level Security (RLS), and a local-first client storage model.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
          <Button asChild size="lg" className="rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
            <Link href="/signup">Create Free Account</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full border-cyan-500/30 bg-slate-900 text-cyan-300 hover:bg-slate-800">
            <a href="/downloads/AetherChat.apk" download="AetherChat.apk" className="flex items-center gap-2">
              <Download className="size-4" /> Download Android APK
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800">
            <Link href="/contact">Contact Maintainers</Link>
          </Button>
        </div>
      </div>

      {/* Target Audience & Purpose */}
      <div className="mt-16 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-md">
        <h2 className="text-xl font-bold text-slate-100">Who Aether Chat is For</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3 text-xs sm:text-sm text-slate-300">
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <h3 className="font-semibold text-cyan-400">Collaborative Teams</h3>
            <p className="text-slate-400 leading-relaxed">
              Fast, focused channels with polls, voice memos, documents, and granular member roles.
            </p>
          </div>
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <h3 className="font-semibold text-cyan-400">Privacy-Conscious Friends</h3>
            <p className="text-slate-400 leading-relaxed">
              No surveillance ad trackers, no algorithmic feeds, and transparent database access rules.
            </p>
          </div>
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <h3 className="font-semibold text-cyan-400">Developers & Students</h3>
            <p className="text-slate-400 leading-relaxed">
              A clean, modern reference implementation of Next.js 16, Supabase Realtime, and Capacitor.
            </p>
          </div>
        </div>
      </div>

      {/* Verified Core Capabilities */}
      <div className="mt-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-100">Verified System Capabilities</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Engineered with modern standards, without exaggerated claims.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md">
            <Zap className="size-8 text-cyan-400 mb-4" />
            <h3 className="text-base font-bold text-slate-100">Real-Time WebSocket Relay</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Broadcast channels powered by Supabase Realtime deliver instant message delivery, live typing debounces, and read receipts across active clients.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md">
            <Lock className="size-8 text-cyan-400 mb-4" />
            <h3 className="text-base font-bold text-slate-100">PostgreSQL Row Level Security</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Strict database policies enforce that users can only select and query messages from conversations where their membership is confirmed in <code className="text-cyan-300">conversation_members</code>.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md">
            <Database className="size-8 text-cyan-400 mb-4" />
            <h3 className="text-base font-bold text-slate-100">Local-First Vault Storage</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Messages and media are indexed client-side in IndexedDB (<code className="text-cyan-300">idb</code>), providing instant loading and a private local media vault on device.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md">
            <Radio className="size-8 text-cyan-400 mb-4" />
            <h3 className="text-base font-bold text-slate-100">Throttled Live Presence</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Presence states are broadcast over transient WebSockets. Persistent database last-seen timestamps are throttled to at most once per 10 minutes to protect database resources.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md">
            <Users className="size-8 text-cyan-400 mb-4" />
            <h3 className="text-base font-bold text-slate-100">Direct & Group Conversations</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Deterministic pair keys eliminate duplicate 1:1 direct chats. Group conversations support Owner, Admin, and Member roles with customizable descriptions and avatars.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md">
            <ShieldCheck className="size-8 text-cyan-400 mb-4" />
            <h3 className="text-base font-bold text-slate-100">Ephemeral Storage Relay</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Attachments (up to 50MB) are delivered via private signed URLs. Server-side storage auto-purges files upon recipient delivery and download acknowledgments.
            </p>
          </div>
        </div>
      </div>

      {/* Platform Support & Actual Limitations */}
      <div className="mt-12 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-md">
        <h2 className="text-xl font-bold text-slate-100 mb-4">Supported Platforms & Known Limitations</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
              <Globe className="size-4" /> Supported Environments
            </h3>
            <ul className="text-xs sm:text-sm text-slate-300 space-y-2 list-disc pl-5 leading-relaxed">
              <li>
                <strong>Modern Web Browsers:</strong> Chrome, Edge, Safari, Firefox, and Chromium derivatives.
              </li>
              <li>
                <strong>Android Native Application:</strong> Tested on Android 5.1 (API 22) through Android 14 (API 34) via Capacitor 8.
              </li>
              <li>
                <strong>Progressive Web App (PWA):</strong> Add-to-homescreen supported on mobile Safari and Chrome.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
              <AlertTriangle className="size-4" /> Current Architectural Limitations
            </h3>
            <ul className="text-xs sm:text-sm text-slate-300 space-y-2 list-disc pl-5 leading-relaxed">
              <li>
                <strong>End-to-End Encryption Status:</strong> Current production uses TLS 1.3 in transit and PostgreSQL RLS at rest. A formal Signal Protocol E2EE proposal is published in <code className="text-cyan-300">docs/e2ee-architecture-proposal.md</code> for future implementation.
              </li>
              <li>
                <strong>iOS Native App:</strong> No native iOS App Store release is currently compiled; iOS users can install Aether Chat as a PWA via Safari.
              </li>
              <li>
                <strong>Attachment Limits:</strong> Media and document uploads are capped at 50MB per file to maintain bandwidth hygiene.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Open Source & Documentation Links */}
      <div className="mt-12 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-md">
        <h2 className="text-lg font-bold text-slate-100 mb-2">Open Source Documentation & Resources</h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
          Aether Chat is released under the MIT License. Review our technical documentation, contribute code, or inspect security policies:
        </p>

        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          <a
            href="https://github.com/akashdebbarma06/Real-Time-Chat-Application"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 transition"
          >
            <span className="flex items-center gap-2 text-slate-200 font-semibold">
              <Code2 className="size-4 text-cyan-400" /> GitHub Repository
            </span>
            <ExternalLink className="size-3.5 text-slate-400" />
          </a>

          <Link
            href="/privacy"
            className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 transition"
          >
            <span className="flex items-center gap-2 text-slate-200 font-semibold">
              <FileText className="size-4 text-cyan-400" /> Privacy Policy
            </span>
            <span className="text-slate-400">&rarr;</span>
          </Link>

          <Link
            href="/terms"
            className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 transition"
          >
            <span className="flex items-center gap-2 text-slate-200 font-semibold">
              <FileText className="size-4 text-cyan-400" /> Terms of Service
            </span>
            <span className="text-slate-400">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
