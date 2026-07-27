"use client";

import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { CapacitorBackButtonHandler } from "@/components/providers/capacitor-back-button-handler";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <CapacitorBackButtonHandler />
      {children}
      <Toaster richColors closeButton position="top-right" />
    </ThemeProvider>
  );
}
