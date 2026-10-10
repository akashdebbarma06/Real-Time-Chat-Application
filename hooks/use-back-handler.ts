"use client";

import { useEffect, useRef } from "react";
import { backButtonManager, type BackPriority } from "@/lib/navigation/back-button-manager";

export interface UseBackHandlerOptions {
  id: string;
  priority: BackPriority | number;
  enabled?: boolean;
  pushHistory?: boolean;
  onBack: () => boolean | void;
}

/**
 * Register a component in the hierarchical back-button navigation stack.
 * Higher priority handlers are invoked first on hardware/browser back press.
 */
export function useBackHandler({
  id,
  priority,
  enabled = true,
  pushHistory = false,
  onBack,
}: UseBackHandlerOptions) {
  const onBackRef = useRef(onBack);
  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    if (!enabled) return;

    return backButtonManager.register({
      id,
      priority,
      pushHistory,
      handleBack: () => onBackRef.current(),
    });
  }, [id, priority, enabled, pushHistory]);
}
