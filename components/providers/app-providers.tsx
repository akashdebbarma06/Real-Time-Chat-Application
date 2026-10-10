"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { AppearanceInitializer } from "@/components/providers/appearance-provider";
import { backButtonManager } from "@/lib/navigation/back-button-manager";
import { useAuthDeepLink } from "@/hooks/use-auth-deep-link";

function BackButtonInitializer() {
  useEffect(() => {
    backButtonManager.init();
  }, []);
  return null;
}

function AuthDeepLinkInitializer() {
  useAuthDeepLink();
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AppearanceInitializer />
      <BackButtonInitializer />
      <AuthDeepLinkInitializer />
      {children}
    </ThemeProvider>
  );
}

