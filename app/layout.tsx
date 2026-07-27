import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: { default: "ChatSphere - Real-Time Messaging Platform", template: "%s · ChatSphere" },
  description: "A fast, secure, real-time messaging and group collaboration platform built for web and Android.",
  keywords: ["chat", "realtime messaging", "chatsphere", "group chat", "direct messaging", "android app"],
  authors: [{ name: "ChatSphere Team" }],
  metadataBase: new URL("https://chatsphere-tan.vercel.app"),
  openGraph: {
    title: "ChatSphere - Real-Time Messaging Platform",
    description: "Connect instantly with friends and teams using ChatSphere.",
    url: "https://chatsphere-tan.vercel.app",
    siteName: "ChatSphere",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatSphere - Real-Time Messaging",
    description: "Instant, secure messaging platform for web and Android.",
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
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
