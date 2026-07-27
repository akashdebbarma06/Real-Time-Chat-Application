"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

export function CapacitorBackButtonHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = CapacitorApp.addListener("backButton", (event) => {
      // If user is inside a conversation (/chat/xyz), navigate back to the conversation list (/chat)
      if (pathname.startsWith("/chat/") && pathname !== "/chat") {
        router.push("/chat");
      } else if (pathname === "/profile" || pathname === "/about" || pathname === "/contact" || pathname === "/privacy" || pathname === "/terms" || pathname === "/cookies") {
        router.push("/chat");
      } else if (event.canGoBack) {
        window.history.back();
      } else {
        void CapacitorApp.minimizeApp();
      }
    });

    return () => {
      void listenerPromise.then((listener) => listener.remove());
    };
  }, [pathname, router]);

  return null;
}
