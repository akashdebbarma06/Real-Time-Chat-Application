"use client";

import { useEffect, useState, useCallback } from "react";
import { BellOff, ChevronRight, MicOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isBannerSnoozed,
  queryPermissionStatus,
  requestDevicePermission,
  snoozeBanner,
  type PermissionId,
} from "@/lib/permissions/device-permissions";
import { cn } from "@/lib/utils";

export interface PermissionBannerProps {
  onManagePermissions?: () => void;
  className?: string;
}

export function PermissionBanner({ onManagePermissions, className }: PermissionBannerProps) {
  const [visible, setVisible] = useState(false);
  const [missingReason, setMissingReason] = useState<string>("");
  const [primaryTarget, setPrimaryTarget] = useState<PermissionId>("notifications");

  const checkEssentialPermissions = useCallback(async () => {
    if (isBannerSnoozed()) {
      setVisible(false);
      return;
    }

    const notifStatus = await queryPermissionStatus("notifications");
    const micStatus = await queryPermissionStatus("microphone");
    const camStatus = await queryPermissionStatus("camera");

    if (notifStatus === "denied") {
      setMissingReason("Notifications are blocked in browser settings. You won't receive call or message alerts.");
      setPrimaryTarget("notifications");
      setVisible(true);
      return;
    }

    if (micStatus === "denied") {
      setMissingReason("Microphone access is blocked. Voice notes and voice calls will be unavailable.");
      setPrimaryTarget("microphone");
      setVisible(true);
      return;
    }

    if (notifStatus === "prompt") {
      setMissingReason("Enable notifications to receive incoming messages and call rings in real time.");
      setPrimaryTarget("notifications");
      setVisible(true);
      return;
    }

    if (micStatus === "prompt" || camStatus === "prompt") {
      setMissingReason("Allow camera and microphone access to enable voice notes and video calling.");
      setPrimaryTarget("microphone");
      setVisible(true);
      return;
    }

    setVisible(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void checkEssentialPermissions();
    }, 0);

    const handlePermChange = () => {
      void checkEssentialPermissions();
    };

    window.addEventListener("aether-permission-change", handlePermChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("aether-permission-change", handlePermChange);
    };
  }, [checkEssentialPermissions]);

  function handleDismiss() {
    snoozeBanner();
    setVisible(false);
  }

  async function handleQuickEnable() {
    if (primaryTarget === "notifications") {
      const res = await requestDevicePermission("notifications");
      if (res.status === "granted") {
        setVisible(false);
        return;
      }
    }
    // If blocked or requires manual settings, open manage modal
    onManagePermissions?.();
  }

  if (!visible) return null;

  return (
    <aside
      aria-label="Device permission alert"
      className={cn(
        "relative flex items-center justify-between gap-3 px-3.5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-foreground transition-all duration-200 text-xs shrink-0",
        className
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="grid size-7 place-items-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
          {primaryTarget === "notifications" ? (
            <BellOff className="size-3.5" />
          ) : (
            <MicOff className="size-3.5" />
          )}
        </div>
        <p className="text-[12px] font-medium text-foreground truncate leading-snug">
          {missingReason}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void handleQuickEnable()}
          className="h-7 px-2.5 rounded-lg text-[11px] font-semibold border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15"
        >
          <span>Enable</span>
          <ChevronRight className="size-3 ml-0.5" />
        </Button>

        <button
          type="button"
          onClick={handleDismiss}
          className="grid size-6 place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition"
          aria-label="Dismiss banner"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </aside>
  );
}
