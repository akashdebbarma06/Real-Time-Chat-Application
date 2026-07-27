import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for ChatSphere application and services.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: July 27, 2026</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Information We Collect</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ChatSphere collects minimal personal information necessary to provide real-time messaging services:
          </p>
          <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
            <li><strong>Account Information:</strong> Email address, username, display name, and avatar image.</li>
            <li><strong>User Content:</strong> Chat messages, uploaded attachments, and conversation metadata.</li>
            <li><strong>Technical Data:</strong> IP address, device type, browser information, and online presence state.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We use collected data solely for operating and improving ChatSphere:
          </p>
          <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
            <li>To authenticate users and secure account access.</li>
            <li>To deliver real-time messages, media attachments, and presence status.</li>
            <li>To protect users against abuse, spam, and security breaches.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Data Storage & Security</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All user data, messages, and uploaded files are stored securely using Supabase PostgreSQL databases and encrypted storage buckets. Access controls are strictly enforced using Row Level Security (RLS) policies so that only authorized conversation members can access chat content.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Data Sharing & Third Parties</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We do not sell, rent, or trade your personal data. Data is shared with third-party service providers (such as Supabase for database infrastructure and Vercel for hosting) exclusively for hosting and powering application functionality.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. User Rights & Account Deletion</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You have full control over your data. You may edit your profile information at any time. To request complete account and data deletion, please contact us at <strong>support@chatsphere.app</strong>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Changes to This Policy</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may update this Privacy Policy periodically. Continued use of ChatSphere following any changes constitutes your acceptance of the updated policy.
          </p>
        </section>
      </div>
    </div>
  );
}
