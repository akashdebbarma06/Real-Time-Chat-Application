import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service governing the use of ChatSphere application and services.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: July 27, 2026</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            By creating an account or using ChatSphere, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the application.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. User Conduct & Acceptable Use</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You agree to use ChatSphere responsibly and legally. You may not:
          </p>
          <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
            <li>Send spam, abusive, harassing, or illegal content.</li>
            <li>Upload malicious software, viruses, or harmful files.</li>
            <li>Attempt to bypass access controls, RLS policies, or authentication mechanisms.</li>
            <li>Impersonate other individuals or entities.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Account Security</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You are responsible for maintaining the confidentiality of your login credentials and for all activities occurring under your account. Notify us immediately if you suspect unauthorized access.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Service Availability & Modifications</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We reserve the right to modify, suspend, or discontinue any feature of ChatSphere at any time without prior notice. We are not liable for any service interruptions or loss of data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Termination</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We reserve the right to terminate or suspend access to accounts violating these Terms of Service without prior notice.
          </p>
        </section>
      </div>
    </div>
  );
}
