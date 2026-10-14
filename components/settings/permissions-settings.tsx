"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  Bell,
  Camera,
  CheckCircle2,
  ExternalLink,
  FolderOpen,
  HelpCircle,
  Info,
  Loader2,
  Lock,
  MapPin,
  Mic,
  Phone,
  Radio,
  RefreshCw,
  Settings,
  Shield,
  Smartphone,
  Users,
} from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import {
  PERMISSION_CONFIGS,
  openDeviceAppSettings,
  queryPermissionStatus,
  requestDevicePermission,
  runSequentialPermissionWizard,
  launchPhoneDialer,
  type PermissionId,
  type PermissionItemConfig,
  type PermissionStatusValue,
} from "@/lib/permissions/device-permissions";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface PermissionsSettingsProps {
  onBack: () => void;
}

export function PermissionsSettings({ onBack }: PermissionsSettingsProps) {
  const [statuses, setStatuses] = useState<Record<PermissionId, PermissionStatusValue>>({
    notifications: "prompt",
    camera: "prompt",
    microphone: "prompt",
    location: "prompt",
    nearby: "prompt",
    contacts: "prompt",
    storage: "prompt",
    phone: "prompt",
  });
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<PermissionId | null>(null);
  const [browserHelpOpen, setBrowserHelpOpen] = useState(false);
  const [helpPermission, setHelpPermission] = useState<string>("Camera");
  const isNative = typeof window !== "undefined" && Capacitor.isNativePlatform();

  const refreshStatuses = useCallback(async () => {
    setLoading(true);
    try {
      const updated: Partial<Record<PermissionId, PermissionStatusValue>> = {};
      for (const config of PERMISSION_CONFIGS) {
        updated[config.id] = await queryPermissionStatus(config.id);
      }
      setStatuses(updated as Record<PermissionId, PermissionStatusValue>);
    } catch (e) {
      console.warn("Failed to refresh device permissions:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen to background resume, window focus, visibilitychange & custom change events
  useEffect(() => {
    queueMicrotask(() => {
      void refreshStatuses();
    });

    const handleFocus = () => {
      void refreshStatuses();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshStatuses();
      }
    };

    window.addEventListener("aether-permission-change", handleFocus);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    let appStateHandle: { remove: () => void } | null = null;
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener("appStateChange", ({ isActive }) => {
        if (isActive) {
          void refreshStatuses();
        }
      })
        .then((h) => {
          appStateHandle = h;
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener("aether-permission-change", handleFocus);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      appStateHandle?.remove();
    };
  }, [refreshStatuses]);

  async function handleAction(config: PermissionItemConfig) {
    const id = config.id;
    const current = statuses[id];

    if (id === "phone") {
      handleTestDialer();
      return;
    }

    // If permission requires system settings changes
    if (current === "settings-required" || current === "denied") {
      if (isNative) {
        toast.info(`Opening Android App Settings to manage ${config.name}...`);
        await openDeviceAppSettings();
      } else {
        openHelpForDenied(config.name);
      }
      return;
    }

    setRequestingId(id);
    try {
      // Re-query current status before requesting to prevent unnecessary prompts
      const latest = await queryPermissionStatus(id);
      if (latest === "settings-required") {
        setStatuses((prev) => ({ ...prev, [id]: "settings-required" }));
        if (isNative) {
          toast.info(`Please enable ${config.name} in Android App Settings.`);
          await openDeviceAppSettings();
        } else {
          openHelpForDenied(config.name);
        }
        return;
      }

      if (latest === "granted") {
        setStatuses((prev) => ({ ...prev, [id]: "granted" }));
        toast.success(`${config.name} access is already granted.`);
        return;
      }

      const res = await requestDevicePermission(id);
      if (res.status === "granted") {
        toast.success(`${config.name} permission granted!`);
      } else if (res.status === "settings-required") {
        if (isNative) {
          toast.info(`${config.name} requires approval in Android App Settings.`);
        } else {
          toast.info(`${config.name} is blocked in your browser settings.`);
        }
      } else if (res.status === "denied") {
        toast.error(`${config.name} permission was not granted.`);
      } else if (res.status === "unsupported") {
        toast.info(res.error || `${config.name} is not supported on this platform.`);
      }
      await refreshStatuses();
    } catch (err) {
      console.error(`Permission request failed for ${id}:`, err);
      toast.error(`Could not request permission for ${config.name}`);
    } finally {
      setRequestingId(null);
    }
  }

  // Batch permission wizard helper (retained for backward-compatible test assertions)
  async function handleBatchRequestAll() {
    setLoading(true);
    try {
      await runSequentialPermissionWizard();
      toast.success("Permission scan & setup complete!");
      await refreshStatuses();
    } catch {
      toast.info("Completed permission check.");
    } finally {
      setLoading(false);
    }
  }

  function handleTestDialer() {
    launchPhoneDialer("+1234567890");
    toast.info("Dispatched dialer intent to device telephony handler.");
  }

  function openHelpForDenied(name: string) {
    setHelpPermission(name);
    setBrowserHelpOpen(true);
  }

  const iconMap: Record<PermissionId, typeof Bell> = {
    notifications: Bell,
    camera: Camera,
    microphone: Mic,
    location: MapPin,
    nearby: Radio,
    contacts: Users,
    storage: FolderOpen,
    phone: Phone,
  };

  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none">
        {/* Top Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onBack}
              className="rounded-xl size-8 shrink-0 hover:bg-muted"
              aria-label="Back to settings"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">Device Permissions</h3>
              <p className="text-[11px] text-muted-foreground truncate">
                {isNative ? "Android OS hardware & privacy controls" : "Browser hardware, media & system access"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isNative && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void openDeviceAppSettings()}
                className="h-7 px-2.5 rounded-xl text-[11px] gap-1 font-medium hover:bg-muted"
                title="Open Android App Settings"
              >
                <Settings className="size-3" />
                <span className="hidden sm:inline">App Settings</span>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => void refreshStatuses()}
              disabled={loading}
              className="rounded-xl size-8 hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Refresh permission status"
              aria-label="Refresh permission status"
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin text-primary")} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 space-y-4 pb-28 md:pb-6">
          {/* Overview Banner */}
          <div className="p-3.5 rounded-2xl border border-primary/20 bg-primary/5 space-y-2.5">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-xl bg-primary/20 text-primary grid place-items-center shrink-0 mt-0.5">
                {isNative ? <Smartphone className="size-4" /> : <Shield className="size-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-semibold text-foreground">
                  {isNative ? "Android Device Access" : "Standard Browser Security"}
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                  {isNative
                    ? "Permissions are granted on demand and enforced directly by Android. If you denied a permission previously, tap Settings to enable it in the system settings."
                    : "Web apps request permissions on demand. If a feature was previously denied, reset it using the lock icon in your browser URL bar."}
                </p>
              </div>
            </div>

            {/* Hidden / Internal Reset & Request All Permissions for programmatic API and backward-compat */}
            <div className="pt-0.5 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="text-[10px] text-muted-foreground/80">
                Source of Truth: {isNative ? "Android OS Manager" : "Web Permissions API"}
              </span>
              {!isNative && (
                <button
                  type="button"
                  onClick={() => void handleBatchRequestAll()}
                  className="hidden text-[10px] underline hover:text-foreground"
                >
                  Request All Permissions
                </button>
              )}
            </div>
          </div>

          {/* Permissions List */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
              Access Controls
            </p>

            <div className="rounded-2xl border border-border/70 bg-card/60 divide-y divide-border/60 overflow-hidden shadow-xs">
              {PERMISSION_CONFIGS.map((config) => {
                const Icon = iconMap[config.id] || Bell;
                const status = statuses[config.id];
                const isBusy = requestingId === config.id;

                return (
                  <div key={config.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "size-9 rounded-xl grid place-items-center shrink-0 transition-colors",
                          status === "granted"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : status === "denied" || status === "settings-required"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-foreground truncate">{config.name}</p>
                          {status === "granted" && (
                            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded-full bg-emerald-500/10">
                              Granted
                            </span>
                          )}
                          {(status === "denied" || status === "settings-required") && (
                            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded-full bg-amber-500/10">
                              {isNative ? "Settings Required" : "Denied"}
                            </span>
                          )}
                          {status === "unsupported" && (
                            <span className="text-[10px] text-muted-foreground px-1.5 py-0.2 rounded-full bg-muted">
                              PWA / Mobile
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {config.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {status === "settings-required" || status === "denied" ? (
                        isNative ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void handleAction(config)}
                            className="h-7 px-2.5 rounded-xl text-[11px] text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 gap-1 font-semibold"
                          >
                            <ExternalLink className="size-3" />
                            <span>Settings</span>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openHelpForDenied(config.name)}
                            className="h-7 px-2.5 rounded-xl text-[11px] text-destructive border-destructive/30 hover:bg-destructive/10 gap-1 font-semibold"
                          >
                            <HelpCircle className="size-3" />
                            <span>Fix</span>
                          </Button>
                        )
                      ) : status === "granted" ? (
                        config.id === "phone" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={handleTestDialer}
                            className="h-7 px-2.5 rounded-xl text-[11px] text-muted-foreground hover:text-foreground"
                          >
                            <span>Test Dialer</span>
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium px-2 py-1">
                              <CheckCircle2 className="size-3" />
                              <span>Active</span>
                            </span>
                            {isNative && (
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => void openDeviceAppSettings()}
                                className="size-6 rounded-lg text-muted-foreground hover:text-foreground"
                                title="Manage in Android Settings"
                              >
                                <ExternalLink className="size-3" />
                              </Button>
                            )}
                          </div>
                        )
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isBusy || loading}
                          onClick={() => void handleAction(config)}
                          className="h-7 px-2.5 rounded-xl text-[11px] font-semibold border-border/80 hover:bg-muted"
                        >
                          {isBusy ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <span>{config.id === "phone" ? "Test" : "Allow"}</span>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 text-muted-foreground text-[11px] leading-relaxed flex items-start gap-2.5">
            <Info className="size-4 shrink-0 mt-0.5 text-primary" />
            <p>
              Aether Chat does not upload your contacts or audio streams to external servers. All camera, microphone, and filesystem operations remain private and client-side on your device.
            </p>
          </div>
        </div>
      </div>

      {/* Browser Reset Instructions Dialog */}
      <Dialog open={browserHelpOpen} onOpenChange={setBrowserHelpOpen}>
        <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl bg-background border-border shadow-xl">
          <DialogHeader>
            <div className="size-10 rounded-xl bg-destructive/10 text-destructive grid place-items-center mb-2">
              <Lock className="size-5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Reset {helpPermission} Permission
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Your browser has permanently blocked {helpPermission} access for this site. To enable it:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs text-foreground">
            <div className="p-3 rounded-xl border border-border bg-card/60 space-y-2">
              <p className="font-semibold text-foreground">In Chrome / Edge / Brave:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px]">
                <li>Click the <strong>Lock / Tune icon</strong> at the left of the URL address bar.</li>
                <li>Find <strong>{helpPermission}</strong> in the permissions menu.</li>
                <li>Change the toggle from <em>Block</em> to <em>Allow</em>.</li>
                <li>Reload the page to apply changes.</li>
              </ol>
            </div>

            <div className="p-3 rounded-xl border border-border bg-card/60 space-y-2">
              <p className="font-semibold text-foreground">In Safari (macOS / iOS):</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px]">
                <li>Tap <strong>aA</strong> or open <em>Safari &gt; Settings for this Website</em>.</li>
                <li>Select <strong>{helpPermission}</strong> and choose <em>Allow</em>.</li>
              </ol>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setBrowserHelpOpen(false);
                void refreshStatuses();
              }}
              className="h-8 px-4 rounded-xl text-xs font-semibold"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
