"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { AppearanceInitializer } from "@/components/providers/appearance-provider";
import { backButtonManager } from "@/lib/navigation/back-button-manager";
import { useAuthDeepLink } from "@/hooks/use-auth-deep-link";

import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";

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

function NativeSplashInitializer() {
  useEffect(() => {
    if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
      // Allow the initial styled DOM frame to paint before fading the native splash screen
      requestAnimationFrame(() => {
        SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {
          // Ignore error if already hidden or platform unsupported
        });
      });
    }
  }, []);
  return null;
}

function NativeSafeAreasInitializer() {
  useEffect(() => {
    if (typeof window !== "undefined" && Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
      const top = document.documentElement.style.getPropertyValue("--safe-area-inset-top");
      if (!top || top === "0px" || top === "") {
        document.documentElement.style.setProperty("--safe-area-inset-top", "28px");
      }
    }
  }, []);
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AppearanceInitializer />
      <NativeSplashInitializer />
      <NativeSafeAreasInitializer />
      <BackButtonInitializer />
      <AuthDeepLinkInitializer />
      {children}
    </ThemeProvider>
  );
}

