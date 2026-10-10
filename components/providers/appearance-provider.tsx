"use client";

import { useEffect } from "react";
import { useAppearance, applyAppearanceToDOM, APP_ICONS } from "@/lib/appearance-store";
import { useDynamicFavicon } from "@/hooks/use-dynamic-favicon";

export function AppearanceInitializer() {
  const { preferences } = useAppearance();
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

  return null;
}
