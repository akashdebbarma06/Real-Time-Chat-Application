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

        {/* Section 2: Categories of Data Collected */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-cyan-400 font-mono">2.</span> Categories of Information Collected
          </h2>
          <p>
            We process only the categories of data strictly required to deliver chat and collaboration functionality:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm text-slate-300">
            <li>
              <strong>Account & Authentication Identifiers:</strong> Email address, unique user UUID (managed by Supabase Auth), secure hashed credentials, and OAuth provider tokens when authenticating via third-party providers.
            </li>
            <li>
              <strong>Profile Information:</strong> Public username (case-insensitive <code className="text-cyan-300">citext</code>), display name, avatar URL, bio text, and transient note status (which expires automatically after 24 hours).
            </li>
            <li>
              <strong>Conversational Content:</strong> Plaintext message body, message type indicator (text, image, video, audio, file, poll), attachments (file name, size, MIME type, storage path), interactive poll structures, emoji reaction records, pinned message records, and starred message records.
            </li>
            <li>
              <strong>Conversation Metadata:</strong> Conversation identifiers, deterministic 1:1 pair keys, group membership lists, and group administrator privileges.
            </li>
            <li>
              <strong>Presence & Online Status:</strong> Online/offline state broadcast over WebSockets, typing event signals, read receipt timestamps (<code className="text-cyan-300">message_reads</code>), and throttled last-seen timestamps updated at most once every 10 minutes.
            </li>
            <li>
              <strong>Client-Side Local Storage:</strong> Cached messages, local draft buffers, theme preferences, and media vault files stored directly in your browser&apos;s <strong>IndexedDB</strong> (<code className="text-cyan-300">idb</code>).
            </li>
            <li>
              <strong>Operational & Diagnostic Telemetry:</strong> Anonymized server request logs, HTTP user-agent headers, and client IP addresses processed transiently for rate limiting and SSRF protection.
            </li>
          </ul>
        </section>

        {/* Section 3: Purposes of Processing */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-cyan-400 font-mono">3.</span> Purposes of Data Processing
          </h2>
          <p>Collected data is used strictly for the following operational purposes:</p>
          <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm text-slate-300">
            <li>Creating, authenticating, and maintaining user accounts and active sessions.</li>
            <li>Transmitting and routing messages, voice notes, polls, and media between conversation members.</li>
            <li>Displaying accurate presence, delivery status checkmarks, and read receipts.</li>
            <li>Enforcing user-directed privacy actions, including member block lists (<code className="text-cyan-300">blocked_users</code>) and group administration controls.</li>
            <li>Preventing spam, abuse, unauthorized access, and denial-of-service via automated rate limiting.</li>
            <li>Providing technical support when users submit support inquiries or GitHub issues.</li>
          </ul>
          <p className="text-xs text-slate-400 italic">
            We never sell, rent, monetize, or trade your personal data or message content to third-party data brokers or advertising networks.
          </p>
        </section>

        {/* Section 4: Third-Party Service Providers */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-cyan-400 font-mono">4.</span> Infrastructure & Service Providers
          </h2>
          <p>
            To deliver high-performance real-time messaging, Aether Chat relies on vetted cloud infrastructure providers:
          </p>
          <div className="grid gap-4 sm:grid-cols-2 text-xs text-slate-300">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1">
              <h3 className="font-semibold text-cyan-400">Supabase Inc.</h3>
              <p>Provides managed PostgreSQL database, authentication, real-time WebSocket channels, and media object storage.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1">
              <h3 className="font-semibold text-cyan-400">Vercel Inc.</h3>
              <p>Hosts Next.js web application assets, App Router edge functions, and serverless API handlers.</p>
            </div>
          </div>
        </section>

        {/* Section 5: Security Architecture & Cryptographic Disclosure */}
        <section className="space-y-3 rounded-2xl border border-cyan-500/30 bg-slate-900/60 p-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="size-5 text-cyan-400" />
            <span className="text-cyan-400 font-mono">5.</span> Security Architecture & Encryption Disclosure
          </h2>
          <p>
            We adhere to transparency and technical accuracy regarding our security controls:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm text-slate-300">
            <li>
              <strong>Encryption in Transit:</strong> All HTTP API traffic and WebSocket real-time streams are encrypted using <strong>TLS 1.3 / HTTPS / WSS</strong>.
            </li>
            <li>
              <strong>Database Access Control (RLS):</strong> PostgreSQL Row Level Security enforces that users can only select and query messages from conversations where their membership is confirmed in <code className="text-cyan-300">conversation_members</code>. Blocked contacts cannot query blocker profiles.
            </li>
            <li>
              <strong>Ephemeral Store-and-Forward Relay:</strong> Unread messages and media are held in server tables only until delivered. Upon recipient delivery acknowledgement (<code className="text-cyan-300">/api/messages/ack-delivery</code>) and download acknowledgement (<code className="text-cyan-300">/api/media/ack-download</code>), server records and media files are purged.
            </li>
            <li>
              <strong>Local Client Vault:</strong> Messages and media persist on your personal device inside your browser&apos;s IndexedDB (<code className="text-cyan-300">idb</code>).
            </li>
            <li>
              <strong>End-to-End Encryption (E2EE) Roadmap:</strong> While messages are encrypted in transit and isolated by database RLS, client-side zero-knowledge E2EE is not yet active on the relay. A formal Signal Protocol (X3DH + Double Ratchet) architecture proposal is published in our repository documentation (<code className="text-cyan-300">docs/e2ee-architecture-proposal.md</code>).
            </li>
          </ul>
        </section>

        {/* Section 6: Data Retention & Deletion */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-cyan-400 font-mono">6.</span> Data Retention & Deletion Policy
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm text-slate-300">
            <li>
              <strong>Ephemeral Messages & Media:</strong> Server-side message attachments are automatically deleted from Supabase Storage once the recipient acknowledges file download. Unread messages remain queued until delivery or account inactivity expiry.
            </li>
            <li>
              <strong>Soft Deletions:</strong> When a user chooses &quot;Delete for everyone&quot;, the message record is marked with <code className="text-cyan-300">deleted_at = now()</code> and its content is cleared from the database.
            </li>
            <li>
              <strong>Device Storage Management:</strong> Users can inspect exact local storage quotas and wipe their local IndexedDB cache at any time using the in-app Storage Settings.
            </li>
            <li>
              <strong>Account Deletion:</strong> Users may request complete account termination and profile purge by contacting the maintainer via our Contact page or GitHub Issues.
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
