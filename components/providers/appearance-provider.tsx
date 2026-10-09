"use client";

import { useEffect } from "react";
import { getStoredAppearance, applyAppearanceToDOM } from "@/lib/appearance-store";

export function AppearanceInitializer() {
  useEffect(() => {
    const prefs = getStoredAppearance();
    applyAppearanceToDOM(prefs);
  }, []);

  return null;
}
