"use client";

import { ThemeProvider } from "next-themes";
import { AppearanceInitializer } from "@/components/providers/appearance-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AppearanceInitializer />
      {children}
    </ThemeProvider>
  );
}
