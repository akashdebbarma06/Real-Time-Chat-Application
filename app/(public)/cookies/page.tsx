import type { Metadata } from "next";
import Link from "next/link";
import { Cookie, HardDrive, Smartphone, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Cookie & Device Storage Policy",
  description: "Detailed disclosure of browser cookies, local storage, and IndexedDB data persistence in Aether Chat.",
};

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 text-slate-100">
      <div className="space-y-10 text-slate-300 leading-relaxed text-sm">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-100 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Cookie & Device Storage Policy
          </h1>
          <p className="mt-2 text-xs text-slate-400">
            Last Updated & Effective: October 15, 2026 • Version 1.1.0
          </p>
          <p className="mt-4 text-sm text-slate-300">
            Aether Chat utilizes browser cookies, HTML5 local storage, and IndexedDB to deliver a fast, responsive, and secure messaging experience. This document transparently explains each category of storage we use and how you can control it.
          </p>
        </div>

        {/* 1. What Technologies We Use */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Cookie className="size-5 text-cyan-400" />
            <span className="text-cyan-400 font-mono">1.</span> Storage Technologies Employed
          </h2>
          <p>
            Unlike traditional websites that rely on tracking cookies to follow users across the internet, Aether Chat is a real-time web application. We use storage strictly for authentication, personalized UI state, and local-first message caching:
          </p>
          <div className="grid gap-4 sm:grid-cols-3 text-xs text-slate-300 pt-2">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1">
              <h3 className="font-semibold text-cyan-400">HTTP Cookies</h3>
              <p>Small cryptographic strings transmitted in HTTP request headers to authenticate your session with Supabase.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1">
              <h3 className="font-semibold text-cyan-400">HTML5 Local Storage</h3>
              <p>Key-value client storage used to persist interface options such as your dark/light theme and accent color.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1">
              <h3 className="font-semibold text-cyan-400">IndexedDB Database</h3>
              <p>A client-side transactional database (<code className="text-cyan-300">idb</code>) that stores message history and your local media vault.</p>
            </div>
          </div>
        </section>

        {/* 2. Detailed Storage Inventory */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-100">
            <span className="text-cyan-400 font-mono">2.</span> Inventory of Stored Data
          </h2>

          <div className="rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-200">
                    <th className="p-3 font-semibold">Storage Type</th>
                    <th className="p-3 font-semibold">Key / Name</th>
                    <th className="p-3 font-semibold">Purpose</th>
                    <th className="p-3 font-semibold">Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-300">
                  <tr>
                    <td className="p-3 font-semibold text-indigo-400">Secure Cookie</td>
                    <td className="p-3 font-medium text-slate-200">Secure Auth Token</td>
                    <td className="p-3">Encrypted login session token maintaining your authenticated account state safely.</td>
                    <td className="p-3 text-emerald-400 font-semibold">Strictly Essential</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-indigo-400">Secure Cookie</td>
                    <td className="p-3 font-medium text-slate-200">Session Guard</td>
                    <td className="p-3">Temporary navigation token ensuring secure routing between chats and settings.</td>
                    <td className="p-3 text-emerald-400 font-semibold">Strictly Essential</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-indigo-400">Local Device Storage</td>
                    <td className="p-3 font-medium text-slate-200">Theme Preferences</td>
                    <td className="p-3">Remembers your preferred color palette and theme mode (dark, light, system).</td>
                    <td className="p-3 text-blue-400 font-semibold">Preference / Functional</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-indigo-400">Local Device Storage</td>
                    <td className="p-3 font-medium text-slate-200">Interface Customization</td>
                    <td className="p-3">Saves message bubble styling, doodle background preferences, and notification sound choices.</td>
                    <td className="p-3 text-blue-400 font-semibold">Preference / Functional</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-indigo-400">Local Vault Storage</td>
                    <td className="p-3 font-medium text-slate-200">Local Message Vault</td>
                    <td className="p-3">Encrypted on-device database storing message history and cached media for instant offline access.</td>
                    <td className="p-3 text-purple-400 font-semibold">Privacy / Local Vault</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 3. Third-Party Analytics & Tracking Statement */}
        <section className="space-y-3 rounded-2xl border border-cyan-500/30 bg-slate-900/50 p-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="size-5 text-cyan-400" />
            <span className="text-cyan-400 font-mono">3.</span> Zero Third-Party Advertising Trackers
          </h2>
          <p>
            Aether Chat contains <strong>zero third-party advertising cookies, zero marketing trackers, and zero cross-site profiling scripts</strong> (such as Google Analytics, Meta Pixel, or marketing beacons). Because all cookies used are strictly essential to authenticate and deliver the Service, no intrusive consent cookie banner is required under ePrivacy and GDPR regulations.
          </p>
        </section>

        {/* 4. Web vs Android Native Storage */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Smartphone className="size-5 text-cyan-400" />
            <span className="text-cyan-400 font-mono">4.</span> Web Browser vs Android Native App Storage
          </h2>
          <p>
            When using the Aether Chat Android APK (built with Capacitor 8), cookies and IndexedDB storage are isolated inside Android&apos;s private sandboxed <code className="text-cyan-300">WebView</code> storage directory. Other applications installed on your phone cannot read or access this sandbox.
          </p>
        </section>

        {/* 5. Managing & Clearing Storage */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <HardDrive className="size-5 text-cyan-400" />
            <span className="text-cyan-400 font-mono">5.</span> Managing & Clearing Your Device Storage
          </h2>
          <p>You have direct, full control over all stored data:</p>
          <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm text-slate-300">
            <li>
              <strong>In-App Storage Manager:</strong> Inside Aether Chat, open <code className="text-cyan-300">Settings &rarr; Storage Management</code>. You can inspect exact MB consumption by photos, videos, audio, and documents, and tap &quot;Clear Media Cache&quot; to wipe local files without losing your account.
            </li>
            <li>
              <strong>Browser Site Data:</strong> You can wipe cookies and site data through your browser settings (*Settings &gt; Privacy & Security &gt; Clear Browsing Data*). Note that clearing essential cookies will log you out of your current session.
            </li>
          </ul>
        </section>

        {/* Contact Note */}
        <section className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-xs text-slate-400">
          <p>
            Have questions regarding our storage practices? Reach out to us via our{" "}
            <Link href="/contact" className="text-cyan-400 underline hover:text-cyan-300">
              Contact Page
            </Link>{" "}
            or review our{" "}
            <Link href="/privacy" className="text-cyan-400 underline hover:text-cyan-300">
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
