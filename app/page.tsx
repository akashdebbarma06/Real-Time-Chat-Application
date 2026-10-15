export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PublicLayout from "@/app/(public)/layout";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Aether Chat — Real-Time Messaging & Collaboration Engine",
  description: "Aether Chat is a fast, local-first real-time messaging engine with PostgreSQL Row Level Security, WebSockets, and Android APK support.",
  openGraph: {
    title: "Aether Chat — Real-Time Messaging & Collaboration Engine",
    description: "Instant messaging, private media vaults, and low-latency presence across web and mobile.",
    type: "website",
  },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ public?: string }>;
}) {
  const params = await searchParams;
  const isExplicitPublic = params?.public === "true";

  let isAuthenticated = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    isAuthenticated = !!data?.claims?.sub;
  } catch {
    isAuthenticated = false;
  }

  // Preserve seamless routing: authenticated users who visit / are sent to /chat unless explicitly requesting the public landing page via ?public=true
  if (isAuthenticated && !isExplicitPublic) {
    redirect("/chat");
  }

  return (
    <PublicLayout>
      <LandingPage isAuthenticated={isAuthenticated} />
    </PublicLayout>
  );
}
