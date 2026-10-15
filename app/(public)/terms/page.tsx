import type { Metadata } from "next";
import Link from "next/link";
import { Info, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service governing usage of the Aether Chat messaging application, web platform, and Android client.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 text-slate-100">
      <div className="space-y-10 text-slate-300 leading-relaxed text-sm">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-100 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="mt-2 text-xs text-slate-400">
            Last Updated & Effective: October 15, 2026 • Version 1.1.0
          </p>
          <p className="mt-4 text-sm text-slate-300">
            Please read these Terms of Service (&quot;Terms&quot;) carefully before using Aether Chat (&quot;the Service&quot;). By creating an account, accessing our web application, or installing our Android APK, you agree to be bound by these Terms.
          </p>
        </div>

        {/* 1. Acceptance & Eligibility */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-cyan-400 font-mono">1.</span> Acceptance & Eligibility
          </h2>
          <p>
            You must be at least 13 years of age (or at least 16 in jurisdictions where local laws mandate a higher age for digital consent) to use Aether Chat. By creating an account or accessing the Service, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these Terms.
          </p>
        </section>

        {/* 2. Service Description */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-cyan-400 font-mono">2.</span> Description & Limitations of the Service
          </h2>
          <p>
            Aether Chat provides real-time messaging, file sharing, audio messaging, and collaboration tools. The Service operates on an ephemeral store-and-forward relay model where messages and media are delivered to recipients and purged from server-side tables upon delivery confirmation.
          </p>
          <p className="text-xs text-slate-400">
            The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We do not guarantee uninterrupted uptime, 100% message delivery under adverse network conditions, or permanent server-side archival.
          </p>
        </section>

        {/* 3. Account Creation & Security */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-cyan-400 font-mono">3.</span> Account Responsibilities & Security
          </h2>
          <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm text-slate-300">
            <li>You agree to provide accurate and truthful account information during registration.</li>
            <li>You are solely responsible for safeguarding your login credentials and authenticating sessions.</li>
            <li>You must promptly notify the maintainer if you discover or suspect unauthorized access to your account.</li>
            <li>You may not transfer, sell, or assign your account to any other individual without consent.</li>
          </ul>
        </section>

        {/* 4. Acceptable Use & Prohibited Conduct */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-cyan-400 font-mono">4.</span> Acceptable Use & Prohibited Conduct
          </h2>
          <p>You agree not to engage in any of the following prohibited behaviors:</p>
          <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm text-slate-300">
            <li>Transmitting hate speech, harassment, threats, defamation, or content that incites violence.</li>
            <li>Distributing malicious code, spyware, viruses, trojans, or corrupted attachments.</li>
            <li>Attempting to probe, scan, or exploit security vulnerabilities or bypass PostgreSQL Row Level Security (RLS) policies.</li>
            <li>Conducting automated spamming, mass message scraping, or bot floods against our WebSocket endpoints.</li>
            <li>Impersonating another person, brand, or entity with deceptive intent.</li>
            <li>Uploading or distributing Child Sexual Abuse Material (CSAM) or any content that exploits minors. Violation results in immediate account termination and reporting to relevant legal authorities.</li>
          </ul>
        </section>

        {/* 5. User Content & Ownership */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-cyan-400 font-mono">5.</span> User Content Ownership & Limited License
          </h2>
          <p>
            <strong>You retain 100% ownership of your content.</strong> You own all copyright and intellectual property rights in the messages, text, photos, audio recordings, documents, and polls you submit through Aether Chat.
          </p>
          <p className="text-xs sm:text-sm text-slate-300">
            By sending content through Aether Chat, you grant us solely the limited, non-exclusive, worldwide, royalty-free license to transmit, temporarily buffer, and route your content to the conversation members designated by you, strictly for the technical operation of the Service.
          </p>
        </section>

        {/* 6. Group Administration & User Conduct */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-cyan-400 font-mono">6.</span> Group Administration & Moderation
          </h2>
          <p>
            Group conversation owners and administrators are responsible for managing member invitations, member roles, and moderating content within their respective groups. Aether Chat provides built-in blocking tools enabling users to cease communication with abusive members.
          </p>
        </section>

        {/* 7. Intellectual Property */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-cyan-400 font-mono">7.</span> Intellectual Property & Open Source
          </h2>
          <p>
            The Aether Chat software codebase is published under the <strong>MIT License</strong>. All rights, title, and interest in Aether Chat trademarks, logos, and visual design assets remain the property of the project maintainer.
          </p>
        </section>

        {/* 8. Third-Party Services & Links */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-cyan-400 font-mono">8.</span> External Links & Third-Party Services
          </h2>
          <p>
            Aether Chat features automatic link preview generation for shared URLs. We do not control, endorse, or assume responsibility for external websites, their privacy practices, or their content. Clicking third-party links is at your own risk.
          </p>
        </section>

        {/* 9. Disclaimers & Limitation of Liability */}
        <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-cyan-400 font-mono">9.</span> Warranty Disclaimers & Limitation of Liability
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 uppercase font-mono">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, AETHER CHAT AND ITS MAINTAINERS DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p className="text-xs sm:text-sm text-slate-300">
            IN NO EVENT SHALL THE MAINTAINERS OR CONTRIBUTORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF DATA, REPUTATION, OR BUSINESS DISRUPTION, ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.
          </p>
        </section>

        {/* 10. Termination */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-cyan-400 font-mono">10.</span> Account Suspension & Termination
          </h2>
          <p>
            We reserve the right to suspend or terminate accounts that breach these Terms or engage in illegal activities, with or without prior notice. You may terminate your account at any time by ceasing use or submitting a deletion request.
          </p>
        </section>

        {/* 11. Governing Law & Dispute Resolution */}
        <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-cyan-400 font-mono">11.</span> Governing Law & Legal Jurisdiction
          </h2>
          <p>
            These Terms shall be interpreted and governed by applicable laws without regard to conflict of law principles.
          </p>
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200/90 flex items-start gap-2">
            <Info className="size-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Owner Legal Notice:</strong> Specific legal jurisdiction, statutory seat, and binding arbitration provisions require formal designation by the business owner upon commercial deployment.
            </span>
          </div>
        </section>

        {/* 12. Contact */}
        <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-cyan-400 font-mono">12.</span> Contact & Questions
          </h2>
          <p>
            If you have questions regarding these Terms of Service, please reach out via our contact channels:
          </p>
          <div className="flex flex-wrap gap-4 text-xs pt-1">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-slate-800 px-4 py-2 font-semibold text-cyan-300 hover:bg-slate-700 transition"
            >
              <FileText className="size-4" /> Contact Form
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
