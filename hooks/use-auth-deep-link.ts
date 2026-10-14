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

        // Deduplication set to ensure each OAuth grant or URL is processed exactly once
        const processedCodes = new Set<string>();

        const handleAuthUrl = async (rawUrl: string) => {
          if (!rawUrl) return;

          // Check if this is an auth callback URL or carries auth tokens/code
          if (
            !rawUrl.includes("auth-callback") &&
            !rawUrl.includes("access_token") &&
            !rawUrl.includes("refresh_token") &&
            !rawUrl.includes("code=")
          ) {
            return;
          }

          // Close the In-App Browser / Custom Tab if open
          try {
            const { Browser } = await import("@capacitor/browser");
            await Browser.close();
          } catch {}

          try {
            // Normalize custom scheme or intent into standard URL structure
            const normalized = rawUrl.replace(/^[a-zA-Z0-9._-]+:\/\//, "https://app.local/");
            const url = new URL(normalized);

            // Extract tokens, code, and errors from query parameters or hash fragment
            const queryParams = url.searchParams;
            const hashParams = new URLSearchParams(
              url.hash ? url.hash.replace(/^#/, "?") : ""
            );

            let code = queryParams.get("code") || hashParams.get("code");
            if (!code) {
              const match = rawUrl.match(/[?&#]code=([^&#]+)/);
              if (match) {
                code = decodeURIComponent(match[1]);
              }
            }

            const accessToken = queryParams.get("access_token") || hashParams.get("access_token");
            const refreshToken = queryParams.get("refresh_token") || hashParams.get("refresh_token");
            const error = queryParams.get("error") || hashParams.get("error");
            const errorDesc = queryParams.get("error_description") || hashParams.get("error_description");

            if (error) {
              console.error("[AuthDeepLink] OAuth error returned:", error, errorDesc);
              const errMsg = errorDesc || error || "Authentication failed";
              window.dispatchEvent(
                new CustomEvent("aether:auth-complete", { detail: { success: false, error: errMsg } })
              );
              toast.error(errMsg);
              return;
            }

            // Deduplication guard: ignore already processed codes
            if (code) {
              if (processedCodes.has(code)) {
                return;
              }
              processedCodes.add(code);
            }

            const supabase = createClient();

            // 1. PKCE Code flow: Exchange code for session in the local client context
            if (code) {
              const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
              if (exchangeError) {
                console.error("[AuthDeepLink] Failed to exchange code for session:", exchangeError);
                window.dispatchEvent(
                  new CustomEvent("aether:auth-complete", {
                    detail: { success: false, error: exchangeError.message || "Failed to complete sign-in" },
                  })
                );
                toast.error(exchangeError.message || "Failed to complete mobile sign-in");
                return;
              }

              // Verify authenticated session before navigating
              const { data: sessionData } = await supabase.auth.getSession();
              if (!sessionData.session) {
                console.warn("[AuthDeepLink] Retrying session verification...");
                await new Promise((r) => setTimeout(r, 400));
              }

              window.dispatchEvent(
                new CustomEvent("aether:auth-complete", { detail: { success: true } })
              );

              toast.success("Signed in successfully!");
              router.replace("/chat");
              router.refresh();
              return;
            }

            // 2. Direct session token payload flow
            if (accessToken && refreshToken) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (sessionError) {
                console.error("[AuthDeepLink] Failed to set session:", sessionError);
                window.dispatchEvent(
                  new CustomEvent("aether:auth-complete", {
                    detail: { success: false, error: sessionError.message || "Failed to sync mobile session" },
                  })
                );
                toast.error(sessionError.message || "Failed to sync mobile session");
                return;
              }

              window.dispatchEvent(
                new CustomEvent("aether:auth-complete", { detail: { success: true } })
              );

              toast.success("Signed in successfully!");
              router.replace("/chat");
              router.refresh();
              return;
            }
          } catch (err) {
            console.error("[AuthDeepLink] Failed to process incoming URL:", err);
            window.dispatchEvent(
              new CustomEvent("aether:auth-complete", {
                detail: { success: false, error: "Unexpected error during mobile authentication" },
              })
            );
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
