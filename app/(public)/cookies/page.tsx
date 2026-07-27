import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Cookie Policy detailing the use of cookies and local storage in ChatSphere.",
};

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Cookie & Storage Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: July 27, 2026</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. What Are Cookies & Local Storage</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cookies and browser local storage are small text data stored on your device when visiting websites or using web applications. They allow the app to remember your preferences and session state.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Essential Cookies Used</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ChatSphere uses strictly essential cookies and local storage tokens for core functionality:
          </p>
          <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
            <li><strong>Authentication Sessions:</strong> Supabase authentication JWT tokens to keep you logged in securely.</li>
            <li><strong>Theme Preference:</strong> Remembers your light/dark mode preference across visits.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Analytics & Third-Party Cookies</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ChatSphere does <strong>not</strong> use third-party advertising, tracking, or cross-site profiling cookies. Minimal telemetry collected by hosting infrastructure (such as Vercel or Next.js) is anonymous and used solely for operational performance monitoring.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Managing Cookies</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You can clear or block cookies in your browser settings. However, disabling essential authentication cookies will prevent you from signing in to ChatSphere.
          </p>
        </section>
      </div>
    </div>
  );
}
