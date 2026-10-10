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
  RotateCcw,
  Shield,
  ShieldAlert,
  Smartphone,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import {
  PERMISSION_CONFIGS,
  getStoredPermissionStates,
  queryPermissionStatus,
  requestDevicePermission,
  runSequentialPermissionWizard,
  launchPhoneDialer,
  type PermissionId,
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

  const refreshStatuses = useCallback(async () => {
    setLoading(true);
    const updated: Partial<Record<PermissionId, PermissionStatusValue>> = {};

    for (const config of PERMISSION_CONFIGS) {
      updated[config.id] = await queryPermissionStatus(config.id);
    }

    setStatuses(updated as Record<PermissionId, PermissionStatusValue>);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshStatuses();
    }, 0);

    const handler = () => {
      void refreshStatuses();
    };
    window.addEventListener("aether-permission-change", handler);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("aether-permission-change", handler);
    };
  }, [refreshStatuses]);

  async function handleRequest(id: PermissionId) {
    setRequestingId(id);
    try {
      const res = await requestDevicePermission(id);
      if (res.status === "granted") {
        toast.success(`Permission for ${id} granted!`);
      } else if (res.status === "denied") {
        toast.error(`Permission for ${id} is denied in your browser settings.`);
      } else if (res.status === "unsupported") {
        toast.info(res.error || `Not supported by current browser.`);
      }
      await refreshStatuses();
    } catch {
      toast.error(`Failed to request permission for ${id}`);
    } finally {
      setRequestingId(null);
    }
  }

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
                Browser hardware, media & system access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
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
                <Shield className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-semibold text-foreground">Standard Browser Security</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                  Web apps request permissions on demand. If a feature was previously denied, reset it using the lock icon in your browser URL bar.
                </p>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-end">
              <Button
                type="button"
                size="sm"
                onClick={() => void handleBatchRequestAll()}
                disabled={loading}
                className="h-7 px-3 rounded-xl text-[11px] font-semibold gap-1.5 shadow-2xs"
              >
                {loading ? <Loader2 className="size-3 animate-spin" /> : <RotateCcw className="size-3" />}
                <span>Request All Permissions</span>
              </Button>
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
                            : status === "denied"
                            ? "bg-destructive/15 text-destructive"
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
                          {status === "denied" && (
                            <span className="text-[10px] font-medium text-destructive px-1.5 py-0.2 rounded-full bg-destructive/10">
                              Denied
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
                      {status === "denied" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openHelpForDenied(config.name)}
                          className="h-7 px-2.5 rounded-xl text-[11px] text-destructive border-destructive/30 hover:bg-destructive/10"
                        >
                          <HelpCircle className="size-3 mr-1" />
                          <span>Fix</span>
                        </Button>
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
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium px-2 py-1">
                            <CheckCircle2 className="size-3" />
                            <span>Active</span>
                          </span>
                        )
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => void handleRequest(config.id)}
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
