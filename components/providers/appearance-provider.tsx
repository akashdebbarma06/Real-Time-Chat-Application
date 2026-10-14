"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useAppearance, applyAppearanceToDOM, APP_ICONS } from "@/lib/appearance-store";
import { useDynamicFavicon } from "@/hooks/use-dynamic-favicon";

export function AppearanceInitializer() {
  const { preferences } = useAppearance();
  const { resolvedTheme } = useTheme();
  const currentAppIcon =
    APP_ICONS.find((i) => i.id === preferences.appIcon) || APP_ICONS[0];

  // Dynamically update favicon and theme-color when app icon or accent changes
  useDynamicFavicon({
    stops: currentAppIcon.stops,
    dotColor: currentAppIcon.dotColor,
  });

  useEffect(() => {
    applyAppearanceToDOM(preferences);
  }, [preferences]);

  // Synchronize Android system navigation bar & status bar immediately with theme changes
  useEffect(() => {
    const isDark = resolvedTheme !== "light";
    const navBarColor = isDark ? "#09090b" : "#ffffff";

    if (typeof window !== "undefined") {
      const cap = (
        window as unknown as {
          Capacitor?: {
            Plugins?: {
              SystemTheme?: {
                setSystemBarsTheme: (opts: { isDark: boolean; navBarColor: string }) => Promise<void>;
              };
            };
          };
        }
      )?.Capacitor;

      if (cap?.Plugins?.SystemTheme) {
        void cap.Plugins.SystemTheme.setSystemBarsTheme({ isDark, navBarColor }).catch(() => {});
      }
    }
  }, [resolvedTheme]);

  return null;
}

