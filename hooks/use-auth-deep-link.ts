"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";

export function useAuthDeepLink() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cleanup = () => {};

    const init = async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        const { App } = await import("@capacitor/app");

        if (Capacitor.isNativePlatform()) {
          try {
            localStorage.setItem("aether_is_native", "true");
          } catch {}
        } else {
          return;
        }

        const handleAuthUrl = async (rawUrl: string) => {
          if (!rawUrl) return;

          // Check if this is an auth callback URL
          if (
            !rawUrl.includes("auth-callback") &&
            !rawUrl.includes("access_token") &&
            !rawUrl.includes("refresh_token")
          ) {
            return;
          }

          try {
            // Normalize custom scheme into standard URL structure
            const normalized = rawUrl.replace(/^[a-zA-Z0-9._-]+:\/\//, "https://app.local/");
            const url = new URL(normalized);

            // Extract tokens from query parameters or hash fragment
            const queryParams = url.searchParams;
            const hashParams = new URLSearchParams(
              url.hash ? url.hash.replace(/^#/, "?") : ""
            );

            const accessToken = queryParams.get("access_token") || hashParams.get("access_token");
            const refreshToken = queryParams.get("refresh_token") || hashParams.get("refresh_token");
            const error = queryParams.get("error") || hashParams.get("error");
            const errorDesc = queryParams.get("error_description") || hashParams.get("error_description");

            if (error) {
              console.error("[AuthDeepLink] OAuth error returned:", error, errorDesc);
              toast.error(errorDesc || error || "Authentication failed");
              return;
            }

            if (accessToken && refreshToken) {
              const supabase = createClient();
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (sessionError) {
                console.error("[AuthDeepLink] Failed to set session:", sessionError);
                toast.error(sessionError.message || "Failed to sync mobile session");
                return;
              }

              toast.success("Signed in successfully!");
              router.replace("/chat");
              router.refresh();
            }
          } catch (err) {
            console.error("[AuthDeepLink] Failed to process incoming URL:", err);
          }
        };

        // 1. Process cold start launch URL
        const launchUrl = await App.getLaunchUrl();
        if (launchUrl?.url) {
          void handleAuthUrl(launchUrl.url);
        }

        // 2. Listen for URL open while app is in background or foreground
        const listener = await App.addListener("appUrlOpen", (data) => {
          void handleAuthUrl(data.url);
        });

        cleanup = () => {
          void listener.remove();
        };
      } catch {
        // Non-capacitor environment or unavailable plugin
      }
    };

    void init();

    return () => {
      cleanup();
    };
  }, [router]);
}
