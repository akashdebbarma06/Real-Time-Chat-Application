import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageSquare, Code, ExternalLink, ShieldCheck } from "lucide-react";
import { PublicContactForm } from "@/components/contact/public-contact-form";

export const metadata: Metadata = {
  title: "Contact & Support",
  description: "Get in touch with the Aether Chat team for technical support, feedback, and project inquiries.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 text-slate-100">
      {/* Logged in notification banner */}
      <div className="mb-8 rounded-2xl border border-cyan-500/30 bg-cyan-950/30 p-4 text-center text-xs text-cyan-200">
        Already have an account?{" "}
        <Link href="/help/contact" className="font-bold underline text-white hover:text-cyan-300">
          Open In-App Support
        </Link>{" "}
        to submit a ticket linked to your user session.
      </div>

      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Contact Aether Chat
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
          Have questions regarding features, report a bug, or inquire about open-source collaboration? Reach out below.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2 items-start">
        {/* Verified Support Channels */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-cyan-500/20 text-cyan-400">
                <Code className="size-5" />
              </span>
              <div>
                <h2 className="font-bold text-slate-100 text-sm">Issue Tracking & Bug Reports</h2>
                <p className="text-xs text-slate-400">Primary technical response channel</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              For bug reports, security reports, and feature requests, GitHub Issues is our primary, verified engineering queue.
            </p>
            <div>
              <a
                href="https://github.com/akashdebbarma06/Real-Time-Chat-Application/issues"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
              >
                <span>Browse GitHub Issues</span>
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-cyan-500/20 text-cyan-400">
                <MessageSquare className="size-5" />
              </span>
              <div>
                <h2 className="font-bold text-slate-100 text-sm">Open-Source Project Repository</h2>
                <p className="text-xs text-slate-400">Public codebase & documentation</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Explore the repository, review our architecture specifications, and contribute to ongoing development.
            </p>
            <div>
              <a
                href="https://github.com/akashdebbarma06/Real-Time-Chat-Application"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
              >
                <span>github.com/akashdebbarma06/Real-Time-Chat-Application</span>
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-cyan-500/20 text-cyan-400">
                <Mail className="size-5" />
              </span>
              <div>
                <h2 className="font-bold text-slate-100 text-sm">Direct Project Contact</h2>
                <p className="text-xs text-slate-400">Maintainer inquiries</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Maintained by Akash Debbarma. Use the web contact form on this page or GitHub to ensure rapid response.
            </p>
          </div>

          {/* Privacy Note */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4 text-xs text-slate-400 leading-relaxed flex items-start gap-3">
            <ShieldCheck className="size-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Inquiry submissions are subject to rate limiting and processed strictly according to our{" "}
              <Link href="/privacy" className="text-cyan-400 underline hover:text-cyan-300">
                Privacy Policy
              </Link>
              . We never sell or share contact information with advertisers.
            </span>
          </div>
        </div>

        {/* Interactive Web Form */}
        <div>
          <PublicContactForm />
        </div>
      </div>
    </div>
  );
}
