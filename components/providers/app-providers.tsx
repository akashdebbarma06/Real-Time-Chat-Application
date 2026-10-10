"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { AppearanceInitializer } from "@/components/providers/appearance-provider";
import { backButtonManager } from "@/lib/navigation/back-button-manager";

function BackButtonInitializer() {
  useEffect(() => {
    backButtonManager.init();
  }, []);
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AppearanceInitializer />
      <BackButtonInitializer />
      {children}
    </ThemeProvider>
  );
}

