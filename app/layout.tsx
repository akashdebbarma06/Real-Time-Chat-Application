import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F17" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: { default: "Aether Chat - Next-Gen Real-Time Messaging", template: "%s · Aether Chat" },
  description: "A fast, secure, premium real-time messaging and team collaboration platform built with cyan-blue aesthetics.",
  keywords: ["aether chat", "realtime messaging", "group chat", "direct messaging", "collaboration", "encrypted chat"],
  authors: [{ name: "Aether Team" }],
  metadataBase: new URL("https://chatsphere-tan.vercel.app"),
  openGraph: {
    title: "Aether Chat - Next-Gen Real-Time Messaging",
    description: "Connect instantly with friends and teams using Aether Chat.",
    url: "https://chatsphere-tan.vercel.app",
    siteName: "Aether Chat",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aether Chat - Real-Time Messaging",
    description: "Next-gen, secure messaging platform for web and mobile.",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-[#0B0F17] text-slate-100`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
