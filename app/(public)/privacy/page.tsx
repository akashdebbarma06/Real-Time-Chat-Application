import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Info, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Comprehensive Privacy Policy detailing data collection, processing, security architecture, and retention practices for Aether Chat.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 text-slate-100">
      {/* In-App Privacy Controls Banner */}
      <div className="mb-8 rounded-2xl border border-cyan-500/30 bg-cyan-950/30 p-4 text-center text-xs text-cyan-200 flex items-center justify-center gap-2">
        <ShieldCheck className="size-4 text-cyan-400 shrink-0" />
        <span>
          Logged in to Aether Chat? Manage your local cache and device storage under{" "}
          <Link href="/help/privacy" className="font-bold underline text-white hover:text-cyan-300">
            In-App Privacy & Storage Controls
          </Link>
          .
        </span>
      </div>

      <div className="space-y-10 text-slate-300 leading-relaxed text-sm">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-100 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="mt-2 text-xs text-slate-400">
            Last Updated & Effective: October 15, 2026 • Version 1.1.0
          </p>
          <p className="mt-4 text-sm text-slate-300">
            This Privacy Policy explains how Aether Chat (&quot;we&quot;, &quot;our&quot;, or &quot;the Service&quot;) collects, stores, processes, and protects information when you use our web platform, Android application, and associated APIs.
          </p>
        </div>

        {/* Section 1: Service Operator */}
        <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className="text-cyan-400 font-mono">1.</span> Service Operator & Project Information
          </h2>
          <p>
            Aether Chat is an open-source real-time messaging application created and maintained by independent developer <strong>Akash Debbarma</strong> (&quot;Maintainer&quot;).
          </p>
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200/90 flex items-start gap-2">
            <Info className="size-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Owner Notice:</strong> This installation operates as a community open-source project. If deployed by a registered commercial enterprise, the operating company entity name, commercial registry number, and registered physical address must be populated prior to commercial offering.
            </span>
          </div>
        </section>

        {/* Section 2: Categories of Information Collected */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-indigo-400 font-mono">2.</span> Information We Collect
          </h2>
          <p>
            We collect only the bare essentials needed to deliver reliable real-time messaging:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm text-slate-300">
            <li>
              <strong>Account & Security Credentials:</strong> Your registered email address, securely salted password hashes, and third-party authentication tokens when signing in with OAuth.
            </li>
            <li>
              <strong>Public Profile:</strong> Your unique username handle, display name, avatar photo, bio text, and optional 24-hour status note.
            </li>
            <li>
              <strong>Messages & Attachments:</strong> Message text, shared photos, videos, voice notes, polls, emoji reactions, and starred message bookmarks.
            </li>
            <li>
              <strong>Conversations & Group Info:</strong> Conversation lists, group participant names, and administrator privileges.
            </li>
            <li>
              <strong>Presence & Delivery Signals:</strong> Real-time online presence, typing indicators, delivery checkmarks, and optional last-seen timestamps.
            </li>
            <li>
              <strong>Local On-Device Storage:</strong> Encrypted on-device message caching and appearance settings saved locally to your device for instant launch and offline reading.
            </li>
            <li>
              <strong>Security & Protection Logs:</strong> Transient server connection logs and IP addresses processed temporarily to prevent spam, abuse, and automated attacks.
            </li>
          </ul>
        </section>

        {/* Section 3: Purposes of Processing */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-indigo-400 font-mono">3.</span> How We Use Your Information
          </h2>
          <p>We process your information strictly to operate and protect your messaging experience:</p>
          <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm text-slate-300">
            <li>Authenticating your account and keeping your sessions secure across devices.</li>
            <li>Delivering messages, media, and notifications instantaneously to conversation recipients.</li>
            <li>Displaying accurate delivery status checkmarks and read receipts.</li>
            <li>Honoring your privacy choices, including your blocked contacts list and group permissions.</li>
            <li>Shielding the platform from spam, denial-of-service, and malicious abuse.</li>
            <li>Responding promptly when you reach out for technical help or report issues.</li>
          </ul>
          <p className="text-xs text-slate-400 italic">
            We never sell, monetize, rent, or share your private conversations or personal data with advertising networks or third-party data brokers.
          </p>
        </section>

        {/* Section 4: Infrastructure & Security Partners */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-indigo-400 font-mono">4.</span> Cloud Infrastructure & Trust Partners
          </h2>
          <p>
            Aether Chat utilizes certified, enterprise-grade cloud providers to host encrypted real-time relays and data storage:
          </p>
          <div className="grid gap-4 sm:grid-cols-2 text-xs text-slate-300">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1.5">
              <h3 className="font-semibold text-indigo-400">Database & Realtime Relay</h3>
              <p>Provides encrypted PostgreSQL databases, authentication services, WebSocket streaming, and secure media storage.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1.5">
              <h3 className="font-semibold text-indigo-400">Application Edge Network</h3>
              <p>Serves optimized web application bundles and secure serverless API endpoints over encrypted edge networks.</p>
            </div>
          </div>
        </section>

        {/* Section 5: Security Architecture & Safeguards */}
        <section className="space-y-3 rounded-2xl border border-indigo-500/30 bg-slate-900/60 p-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="size-5 text-indigo-400" />
            <span className="text-indigo-400 font-mono">5.</span> Security Safeguards & Privacy by Design
          </h2>
          <p>
            We build privacy into every layer of our messaging architecture:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm text-slate-300">
            <li>
              <strong>Encrypted in Transit:</strong> Every message, media attachment, and real-time event is encrypted using strong industry-standard TLS 1.3 protocols.
            </li>
            <li>
              <strong>Strict Conversation Isolation:</strong> Database access controls verify membership before any message can be viewed. Non-members and blocked users cannot access or read your chats.
            </li>
            <li>
              <strong>Ephemeral Server Relay:</strong> Media and unread messages are held on server relays only until delivered, then automatically purged from relay storage upon recipient download acknowledgement.
            </li>
            <li>
              <strong>Local Vault Protection:</strong> Your complete chat history and downloaded vault media are stored on your personal device, giving you total control over your local data.
            </li>
            <li>
              <strong>Transparent Security Roadmap:</strong> We maintain an open-source development model and actively design toward client-side zero-knowledge encryption protocols.
            </li>
          </ul>
        </section>

        {/* Section 6: Data Retention & User Control */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-indigo-400 font-mono">6.</span> Data Retention & Your Control
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm text-slate-300">
            <li>
              <strong>Automatic Media Purging:</strong> Server-side attachments are deleted as soon as recipients confirm download. Unread messages are kept only until delivered.
            </li>
            <li>
              <strong>Delete for Everyone:</strong> When you delete a message for everyone, its contents are wiped from database servers and removed across conversation members.
            </li>
            <li>
              <strong>Device Storage Management:</strong> Inspect cache size and clear local device storage anytime from in-app Storage Settings.
            </li>
            <li>
              <strong>Account Deletion:</strong> You have the permanent right to delete your account, wipe all associated profile data, and remove yourself from all conversations.
            </li>
          </ul>
        </section>

        {/* Section 7: User Rights */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-cyan-400 font-mono">7.</span> User Rights & Privacy Controls
          </h2>
          <p>
            Under applicable data protection frameworks (such as GDPR and CCPA), you hold the following rights:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm text-slate-300">
            <li><strong>Right to Access:</strong> View the profile and conversation data associated with your account.</li>
            <li><strong>Right to Rectification:</strong> Update your username, display name, bio, and avatar directly from your profile settings.</li>
            <li><strong>Right to Erasure:</strong> Delete messages, leave groups, or request complete account erasure.</li>
            <li><strong>Right to Object:</strong> Block contacts to instantly cease real-time communication.</li>
          </ul>
        </section>

        {/* Section 8: Children's Privacy */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-cyan-400 font-mono">8.</span> Children & Age Requirements
          </h2>
          <p>
            Aether Chat is not directed to individuals under the age of 13 (or under 16 where required by regional law). We do not knowingly collect personal information from children. If you become aware that a child has created an account without parental consent, please contact us immediately for prompt termination.
          </p>
        </section>

        {/* Section 9: Changes to Policy */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-cyan-400 font-mono">9.</span> Policy Modifications
          </h2>
          <p>
            We may revise this Privacy Policy periodically to reflect architectural updates or legal requirements. Material updates will be indicated by the &quot;Last Updated&quot; revision timestamp at the top of this document. Continued use of the Service following revisions constitutes acknowledgment of the updated policy.
          </p>
        </section>

        {/* Section 10: Contact Information */}
        <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-cyan-400 font-mono">10.</span> Privacy Inquiries & Contact Route
          </h2>
          <p>
            For privacy inquiries, data subject access requests, or security notices, reach out via:
          </p>
          <div className="flex flex-wrap gap-4 text-xs pt-1">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-slate-800 px-4 py-2 font-semibold text-cyan-300 hover:bg-slate-700 transition"
            >
              <FileText className="size-4" /> Web Contact Form
            </Link>
            <a
              href="https://github.com/akashdebbarma06/Real-Time-Chat-Application/issues"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              GitHub Project Issues &rarr;
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
