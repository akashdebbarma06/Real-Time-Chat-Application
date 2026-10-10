"use client";

import { useState } from "react";
import {
  Bell,
  Camera,
  CheckCircle2,
  ChevronRight,
  HardDrive,
  Loader2,
  MapPin,
  Mic,
  Radio,
  Shield,
  ShieldAlert,
  Smartphone,
  Users,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  PERMISSION_CONFIGS,
  type PermissionId,
  type PermissionStatusValue,
  markInitialPermissionsPrompted,
  requestDevicePermission,
  runSequentialPermissionWizard,
} from "@/lib/permissions/device-permissions";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useBackHandler } from "@/hooks/use-back-handler";

export interface PermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function PermissionModal({ open, onOpenChange, onComplete }: PermissionModalProps) {
  const [inProgress, setInProgress] = useState(false);
  const [currentStep, setCurrentStep] = useState<PermissionId | null>(null);
  const [stepStatuses, setStepStatuses] = useState<Partial<Record<PermissionId, PermissionStatusValue>>>({});

  const primaryPermissions: {
    id: PermissionId;
    icon: typeof Bell;
    title: string;
    description: string;
  }[] = [
    {
      id: "notifications",
      icon: Bell,
      title: "Notifications",
      description: "Alerts for incoming messages, call rings & mentions.",
    },
    {
      id: "microphone",
      icon: Mic,
      title: "Microphone",
      description: "Record voice notes and make crystal-clear audio calls.",
    },
    {
      id: "camera",
      icon: Camera,
      title: "Camera",
      description: "Send instant photo notes and join video calls.",
    },
    {
      id: "location",
      icon: MapPin,
      title: "Location",
      description: "Share live locations and venue pins with friends.",
    },
    {
      id: "nearby",
      icon: Radio,
      title: "Nearby Devices",
      description: "Bluetooth headset audio routing and wearable sync.",
    },
  ];

  async function handleAllowAll() {
    setInProgress(true);
    try {
      await runSequentialPermissionWizard((step, status) => {
        setCurrentStep(step);
        setStepStatuses((prev) => ({ ...prev, [step]: status }));
      });
      toast.success("Permission setup complete!");
      onComplete?.();
      onOpenChange(false);
    } catch {
      toast.info("Setup complete. You can adjust permissions anytime in Settings.");
      onComplete?.();
      onOpenChange(false);
    } finally {
      setInProgress(false);
      setCurrentStep(null);
    }
  }

  function handleDismiss() {
    markInitialPermissionsPrompted();
    onOpenChange(false);
    toast.info("You can enable permissions anytime from Settings > Device Permissions.");
  }

  // Priority 1: Permission Onboarding Modal
  useBackHandler({
    id: "permission-modal",
    priority: 100,
    enabled: open,
    onBack: handleDismiss,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[480px] p-0 overflow-hidden bg-background border-border/80 shadow-2xl rounded-2xl"
      >
        {/* Top Header Banner */}
        <div className="relative p-6 pb-5 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-border/60">
          <button
            type="button"
            onClick={handleDismiss}
            disabled={inProgress}
            className="absolute top-4 right-4 size-8 rounded-full grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="size-11 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-md">
              <Shield className="size-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
                Device & Web Permissions
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-medium">
                Experience full real-time communication
              </p>
            </div>
          </div>

          <DialogDescription className="text-xs text-muted-foreground leading-relaxed mt-2">
            Aether Chat requires standard browser access to deliver messages, voice notes, and video calls.
            You can modify these choices at any time in Settings.
          </DialogDescription>
        </div>

        {/* Permissions List */}
        <div className="p-4 space-y-2 max-h-[340px] overflow-y-auto scrollbar-thin">
          {primaryPermissions.map((item) => {
            const Icon = item.icon;
            const status = stepStatuses[item.id];
            const isCurrent = inProgress && currentStep === item.id;

            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border transition-all",
                  isCurrent
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border/60 bg-card/40 hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div
                    className={cn(
                      "size-9 rounded-xl grid place-items-center shrink-0 transition-colors",
                      status === "granted"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : status === "denied"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-muted text-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{item.description}</p>
                  </div>
                </div>

                {/* State Badge / Indicator */}
                <div className="shrink-0 flex items-center">
                  {isCurrent ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium">
                      <Loader2 className="size-3 animate-spin" />
                      <span>Prompting</span>
                    </div>
                  ) : status === "granted" ? (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                      <CheckCircle2 className="size-3" />
                      <span>Allowed</span>
                    </div>
                  ) : status === "denied" ? (
                    <span className="text-[11px] font-medium text-destructive px-2 py-0.5 rounded-full bg-destructive/10">
                      Denied
                    </span>
                  ) : status === "unsupported" ? (
                    <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                      N/A
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground font-medium">Pending</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 pt-3 bg-muted/20 border-t border-border/60 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={inProgress}
            onClick={handleDismiss}
            className="text-xs text-muted-foreground hover:text-foreground h-9 px-3 rounded-xl"
          >
            Maybe Later
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={inProgress}
            onClick={() => void handleAllowAll()}
            className="h-9 px-4 rounded-xl text-xs font-semibold gap-1.5 shadow-sm"
          >
            {inProgress ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Requesting...</span>
              </>
            ) : (
              <>
                <span>Allow Permissions</span>
                <ChevronRight className="size-3.5" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
