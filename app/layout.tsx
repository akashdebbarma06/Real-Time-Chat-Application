import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const viewport: Viewport = {
  themeColor: "#00A884",
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
  metadataBase: new URL(baseUrl),
  openGraph: {
    title: "Aether Chat - Next-Gen Real-Time Messaging",
    description: "Connect instantly with friends and teams using Aether Chat.",
    url: baseUrl,
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
    icon: [{ url: "/favicon.svg?v=2", type: "image/svg+xml" }],
    shortcut: "/favicon.svg?v=2",
    apple: "/favicon.svg?v=2",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-svh bg-background text-foreground`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

