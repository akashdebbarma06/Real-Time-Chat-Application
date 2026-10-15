import Link from "next/link";
import {
  MessageCircleMore,
  ShieldCheck,
  Zap,
  Users,
  Lock,
  Download,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Database,
  Send,
  Paperclip,
  Mic,
  CheckCheck,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingPageProps {
  isAuthenticated?: boolean;
}

export function LandingPage({ isAuthenticated = false }: LandingPageProps) {
  return (
    <div className="flex flex-col gap-20 sm:gap-28 pb-16 text-slate-100 overflow-x-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 lg:pt-28 text-center px-4 sm:px-6 max-w-5xl mx-auto">
        {/* Glow backdrop decorative accent */}
        <div
          className="absolute -top-10 left-1/2 -translate-x-1/2 -z-10 h-72 w-full max-w-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-600/15 to-indigo-500/10 blur-3xl rounded-full pointer-events-none"
          aria-hidden="true"
        />

        {/* Brand Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-400 mb-6 shadow-sm shadow-cyan-500/10">
          <MessageCircleMore className="size-3.5" />
          <span>Real-Time Messaging • Local-First Architecture</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Instant Communication. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Built for Privacy & Speed.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Aether Chat is a modern real-time messaging engine. Enjoy low-latency WebSockets, PostgreSQL Row Level Security, and a local device vault across web and Android.
        </p>

        {/* Calls to Action */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
          {isAuthenticated ? (
            <Button
              asChild
              size="lg"
              className="rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-7 sm:px-8 shadow-lg shadow-cyan-500/25 h-12 text-sm sm:text-base gap-2"
            >
              <Link href="/chat">
                <span>Continue to Chat</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                size="lg"
                className="rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-7 sm:px-8 shadow-lg shadow-cyan-500/25 h-12 text-sm sm:text-base gap-2 transition"
              >
                <Link href="/signup">
                  <span>Get Started Free</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full border-slate-700 bg-slate-900/90 text-slate-200 hover:bg-slate-800 hover:text-white px-6 sm:px-7 h-12 text-sm sm:text-base font-semibold shadow-sm"
              >
                <Link href="/login">Launch App</Link>
              </Button>
            </>
          )}

          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full border-cyan-500/30 bg-slate-900/80 text-cyan-300 hover:bg-slate-800 hover:text-cyan-200 px-5 sm:px-6 h-12 text-sm font-semibold"
          >
            <a href="/downloads/AetherChat.apk" download="AetherChat.apk" className="flex items-center gap-2">
              <Download className="size-4" />
              <span>Android APK</span>
            </a>
          </Button>
        </div>

        {/* Verification badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-cyan-400" />
            <span>PostgreSQL RLS Protected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-cyan-400" />
            <span>Local IndexedDB Vault</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-cyan-400" />
            <span>Zero Third-Party Ad Trackers</span>
          </div>
        </div>
      </section>

      {/* 2. FAITHFUL PRODUCT UI PREVIEW */}
      <section className="px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-6">
          <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-bold">
            Live Product Interface
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Intuitive navigation, rich media previews, and instant presence indicator.
          </p>
        </div>

        {/* Mock App Frame */}
        <div className="rounded-3xl border border-slate-800/90 bg-[#0E1524] shadow-2xl shadow-cyan-500/10 overflow-hidden ring-1 ring-slate-800/60">
          {/* Window Title Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-950/70">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-rose-500/80" />
              <div className="size-3 rounded-full bg-amber-500/80" />
              <div className="size-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs text-slate-400 font-mono ml-2">Aether Chat — Workspace</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Connected (WSS)</span>
            </div>
          </div>

          {/* App Body Grid (Sidebar + Active Chat Room) */}
          <div className="grid md:grid-cols-12 min-h-[460px]">
            {/* Left Sidebar Mockup */}
            <div className="hidden md:block md:col-span-4 border-r border-slate-800/80 bg-slate-950/40 p-3 space-y-2">
              <div className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Conversations
              </div>

              {/* Chat 1: Active Direct */}
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30">
                <div className="relative">
                  <div className="size-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-slate-950 font-bold text-sm">
                    JD
                  </div>
                  <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="text-xs font-bold text-slate-100 truncate">Jordan Diaz</p>
                    <span className="text-[10px] text-cyan-400 font-mono">10:42 AM</span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate">I just tested the APK on Android 14!</p>
                </div>
              </div>

              {/* Chat 2: Group Space */}
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-900/30 border border-slate-800/60 hover:bg-slate-900/50 transition">
                <div className="relative">
                  <div className="size-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    DT
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="text-xs font-semibold text-slate-200 truncate">Design Team</p>
                    <span className="text-[10px] text-slate-500 font-mono">Yesterday</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">Maya created a new poll: Accent color</p>
                </div>
                <span className="size-4 rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950 flex items-center justify-center">
                  2
                </span>
              </div>

              {/* Chat 3: Direct */}
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-900/30 border border-slate-800/60 hover:bg-slate-900/50 transition">
                <div className="relative">
                  <div className="size-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                    SR
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="text-xs font-semibold text-slate-200 truncate">Sam Rivera</p>
                    <span className="text-[10px] text-slate-500 font-mono">Oct 12</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">Thanks for sharing the release build!</p>
                </div>
              </div>
            </div>

            {/* Active Conversation Room Mockup */}
            <div className="md:col-span-8 flex flex-col justify-between bg-[#0B0F17]/90 p-4 sm:p-5">
              {/* Room Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="size-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-slate-950 font-bold text-xs">
                      JD
                    </div>
                    <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-100">Jordan Diaz</h3>
                    <p className="text-[10px] text-emerald-400 font-medium">Online • Active now</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-semibold">
                    Local Vault
                  </span>
                </div>
              </div>

              {/* Message Feed Area */}
              <div className="py-4 space-y-3.5 flex-1 overflow-y-auto">
                {/* Security Pill */}
                <div className="text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                    <Lock className="size-3 text-cyan-400" />
                    Messages are protected with database access controls and encrypted in transit.
                  </span>
                </div>

                {/* Recipient Message */}
                <div className="flex items-end gap-2 max-w-[85%]">
                  <div className="size-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                    JD
                  </div>
                  <div className="rounded-2xl rounded-bl-sm bg-slate-800/90 border border-slate-700/60 p-3 text-xs text-slate-200 space-y-1 shadow-sm">
                    <p>Hey! Did you check the latest APK release build on Android?</p>
                    <span className="block text-[10px] text-slate-400 text-right">10:40 AM</span>
                  </div>
                </div>

                {/* Sender Reply Message */}
                <div className="flex items-end justify-end gap-2 ml-auto max-w-[85%]">
                  <div className="rounded-2xl rounded-br-sm bg-cyan-600 text-white p-3 text-xs space-y-1 shadow-md shadow-cyan-600/20">
                    <p>Yes! Installed cleanly. Hardware back button and offline cache worked immediately.</p>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-cyan-200">
                      <span>10:41 AM</span>
                      <CheckCheck className="size-3 text-cyan-200" />
                    </div>
                  </div>
                </div>

                {/* Recipient Message with Interactive Poll */}
                <div className="flex items-end gap-2 max-w-[88%]">
                  <div className="size-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                    JD
                  </div>
                  <div className="rounded-2xl rounded-bl-sm bg-slate-800/90 border border-slate-700/60 p-3.5 text-xs text-slate-200 space-y-2.5 shadow-sm w-full max-w-sm">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                      <BarChart2 className="size-4" />
                      <span>Poll: Which theme accent do you prefer?</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="p-2 rounded-xl bg-slate-900 border border-cyan-500/40 text-[11px] flex justify-between items-center">
                        <span className="font-medium text-cyan-300">Cyan / Neon Blue</span>
                        <span className="text-[10px] text-slate-400">75% (3 votes)</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] flex justify-between items-center">
                        <span className="text-slate-300">Emerald Green</span>
                        <span className="text-[10px] text-slate-400">25% (1 vote)</span>
                      </div>
                    </div>
                    <span className="block text-[10px] text-slate-400 text-right">10:42 AM</span>
                  </div>
                </div>
              </div>

              {/* Message Composer Bar */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-2xl px-3 py-2 text-xs">
                  <Paperclip className="size-4 text-slate-400 hover:text-cyan-400 transition cursor-pointer" />
                  <input
                    type="text"
                    readOnly
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent border-0 text-slate-200 placeholder:text-slate-500 text-xs focus:outline-none"
                  />
                  <Mic className="size-4 text-slate-400 hover:text-cyan-400 transition cursor-pointer" />
                  <div className="size-7 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-bold">
                    <Send className="size-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VERIFIED CORE FEATURES GRID */}
      <section className="px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-bold">
            Engineered Capabilities
          </h2>
          <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Everything You Need to Communicate
          </h3>
          <p className="mt-3 text-sm text-slate-400">
            Carefully tuned for responsiveness, memory safety, and client data sovereignty.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-7 backdrop-blur-md space-y-3">
            <Zap className="size-7 text-cyan-400" />
            <h4 className="text-base font-bold text-slate-100">Instant WebSocket Relay</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Realtime message broadcasts, live typing indicators with auto-reset debounce, and delivery status checkmarks.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-7 backdrop-blur-md space-y-3">
            <Users className="size-7 text-cyan-400" />
            <h4 className="text-base font-bold text-slate-100">Direct & Group Channels</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Deterministic 1:1 chat keys eliminate duplicates. Group conversations feature owner, admin, and member role privileges.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-7 backdrop-blur-md space-y-3">
            <Database className="size-7 text-cyan-400" />
            <h4 className="text-base font-bold text-slate-100">Local-First Vault Storage</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Messages and media persist in your device&apos;s IndexedDB (<code className="text-cyan-300">idb</code>), eliminating network roundtrips for cached content.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-7 backdrop-blur-md space-y-3">
            <Lock className="size-7 text-cyan-400" />
            <h4 className="text-base font-bold text-slate-100">Database Access Control</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              PostgreSQL Row Level Security ensures non-members cannot read or probe conversation contents or roles.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-7 backdrop-blur-md space-y-3">
            <ShieldCheck className="size-7 text-cyan-400" />
            <h4 className="text-base font-bold text-slate-100">Ephemeral Storage Purge</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Attachments (up to 50MB) are served via signed URLs and auto-purged from server tables once downloaded by recipients.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-7 backdrop-blur-md space-y-3">
            <Smartphone className="size-7 text-cyan-400" />
            <h4 className="text-base font-bold text-slate-100">Native Android Support</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Compiled with Capacitor 8 for Android 5.1 through Android 14 with full hardware back button navigation.
            </p>
          </div>
        </div>
      </section>

      {/* 4. HOW TO GET STARTED (3 SIMPLE STEPS) */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto w-full">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 sm:p-12 backdrop-blur-md">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-bold">
              Simple Onboarding
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-100 mt-2">
              Get Started in Minutes
            </h3>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2 p-5 rounded-2xl bg-slate-950/60 border border-slate-800 text-center sm:text-left">
              <span className="size-8 rounded-xl bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-sm mb-3">
                01
              </span>
              <h4 className="font-bold text-slate-100 text-sm">Create an Account</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sign up with your email. Choose a unique handle and personalize your avatar.
              </p>
            </div>

            <div className="space-y-2 p-5 rounded-2xl bg-slate-950/60 border border-slate-800 text-center sm:text-left">
              <span className="size-8 rounded-xl bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-sm mb-3">
                02
              </span>
              <h4 className="font-bold text-slate-100 text-sm">Start a Conversation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Search friends by handle to launch 1:1 direct chats or create collaborative group spaces.
              </p>
            </div>

            <div className="space-y-2 p-5 rounded-2xl bg-slate-950/60 border border-slate-800 text-center sm:text-left">
              <span className="size-8 rounded-xl bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-sm mb-3">
                03
              </span>
              <h4 className="font-bold text-slate-100 text-sm">Connect Seamlessly</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Send voice notes, polls, and media from any modern browser or install the Android APK.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRIVACY & SECURITY SPOTLIGHT */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto w-full">
        <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/90 via-[#0B132B] to-slate-900/90 p-8 sm:p-12 shadow-xl backdrop-blur-md">
          <div className="grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7 space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-400">
                <ShieldCheck className="size-3.5" /> Data Sovereignty
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                Privacy Founded on Clear Architecture
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                We believe security begins with honest communication. Aether Chat uses TLS 1.3 encryption in transit, strict PostgreSQL RLS policies at the database layer, and a store-and-forward relay that purges server-side media upon recipient delivery confirmation.
              </p>
              <div className="pt-2">
                <Link
                  href="/privacy"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition"
                >
                  <span>Read our detailed Privacy Policy</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>

            <div className="md:col-span-5 space-y-2.5">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
                <p className="font-bold text-slate-200">Zero Advertising Trackers</p>
                <p className="text-slate-400 text-[11px] mt-0.5">No cross-site profiling or third-party marketing SDKs.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
                <p className="font-bold text-slate-200">Local-First Persistence</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Client-side IndexedDB cache under your local control.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
                <p className="font-bold text-slate-200">Open-Source Codebase</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Transparent, inspectable repository licensed under MIT.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FINAL CALL TO ACTION */}
      <section className="px-4 sm:px-6 max-w-4xl mx-auto w-full text-center">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950 p-8 sm:p-14 shadow-2xl backdrop-blur-md">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Ready to Experience Aether Chat?
          </h2>
          <p className="mt-3 text-sm text-slate-400 max-w-md mx-auto">
            Join the platform today on web or download the Android APK. Free and open source.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-8 shadow-lg shadow-cyan-500/20 text-sm h-12"
            >
              <Link href={isAuthenticated ? "/chat" : "/signup"}>
                {isAuthenticated ? "Launch Chat Application" : "Create Account Free"}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 text-sm h-12"
            >
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
