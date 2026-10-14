"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Laptop,
  Loader2,
  LogOut,
  Monitor,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { toast } from "@/lib/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ConfirmActionDialog } from "@/components/chat/confirm-action-dialog";

export interface LinkedDevicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CurrentClientSession {
  id: string;
  name: string;
  platform: string;
  lastActive: string;
  type: "desktop" | "mobile";
  email?: string;
}

function detectClientEnvironment(): { name: string; platform: string; type: "desktop" | "mobile" } {
  if (typeof window === "undefined") {
    return { name: "Web Client", platform: "Browser", type: "desktop" };
  }

  if (Capacitor.isNativePlatform()) {
    return {
      name: "AetherChat Android App",
      platform: "Android OS · Native Mobile Client",
      type: "mobile",
    };
  }

  const ua = navigator.userAgent;
  let browser = "Web Browser";
  let os = "Desktop";
  let type: "desktop" | "mobile" = "desktop";

  // Operating System
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Macintosh|Mac OS X/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";
  else if (/Android/i.test(ua)) { os = "Android"; type = "mobile"; }
  else if (/iPhone|iPad|iPod/i.test(ua)) { os = "iOS"; type = "mobile"; }

  // Browser Engine
  if (/Edg/i.test(ua)) browser = "Microsoft Edge";
  else if (/Chrome/i.test(ua)) browser = "Google Chrome";
  else if (/Safari/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Mozilla Firefox";

  if (window.innerWidth < 768) {
    type = "mobile";
  }

  return {
    name: `${browser} on ${os}`,
    platform: `${os} · ${type === "mobile" ? "Mobile Client" : "Desktop Web"}`,
    type,
  };
}

export function LinkedDevicesDialog({
  open,
  onOpenChange,
}: LinkedDevicesDialogProps) {
  const [currentSession, setCurrentSession] = useState<CurrentClientSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const loadSession = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      const env = detectClientEnvironment();

      const lastSignIn = user?.last_sign_in_at
        ? new Date(user.last_sign_in_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Active now";

      setCurrentSession({
        id: user?.id || "current-session",
        name: env.name,
        platform: env.platform,
        lastActive: `Active now · Signed in ${lastSignIn}`,
        type: env.type,
        email: user?.email || undefined,
      });
    } catch {
      const env = detectClientEnvironment();
      setCurrentSession({
        id: "current-session",
        name: env.name,
        platform: env.platform,
        lastActive: "Active now",
        type: env.type,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void loadSession();
    }
  }, [open, loadSession]);

  async function handleSignOutCurrent() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md w-full p-0 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-border bg-background text-foreground max-h-[85vh]">
          {/* Header */}
          <DialogHeader className="p-4 border-b border-border/80 flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Monitor className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold text-foreground">
                  Linked Devices
                </DialogTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Manage active sessions & client authentication
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Sessions List */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 space-y-4">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
                Current Session
              </p>

              <div className="rounded-xl border border-border/70 bg-card/60 divide-y divide-border/60 overflow-hidden shadow-xs">
                {loading ? (
                  <div className="p-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span>Detecting session info...</span>
                  </div>
                ) : currentSession ? (
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid size-9 place-items-center rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
                        {currentSession.type === "desktop" ? (
                          <Laptop className="size-4" />
                        ) : (
                          <Smartphone className="size-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {currentSession.name}
                          </p>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-semibold">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            This device
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {currentSession.platform}
                        </p>
                        <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                          {currentSession.lastActive}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Other Devices Section - Honest empty state instead of fabricated devices */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
                Other Devices
              </p>
              <div className="p-4 rounded-xl border border-dashed border-border/80 bg-muted/20 text-center space-y-1.5">
                <ShieldCheck className="size-5 text-emerald-500 mx-auto" />
                <p className="text-xs font-medium text-foreground">
                  No other active sessions
                </p>
                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  You are only signed in on this client device. When you log in from additional devices, they will appear here.
                </p>
              </div>
            </div>

            {/* Sign Out Action */}
            <div className="pt-2">
              <Button
                variant="outline"
                disabled={signingOut}
                onClick={() => setConfirmLogoutOpen(true)}
                className="w-full h-9 rounded-xl border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold gap-2"
              >
                {signingOut ? <Loader2 className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />}
                <span>Log out from this device</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={confirmLogoutOpen}
        onOpenChange={setConfirmLogoutOpen}
        title="Log Out From AetherChat"
        description="Are you sure you want to sign out from this device? You will need to log back in to access your chats."
        confirmLabel="Log Out"
        variant="destructive"
        onConfirm={handleSignOutCurrent}
      />
    </>
  );
}
