"use client";

import { useState } from "react";
import {
  Check,
  ChevronRight,
  Laptop,
  Loader2,
  LogOut,
  Monitor,
  Phone,
  Shield,
  Smartphone,
  Trash2,
} from "lucide-react";
import { toast } from "@/lib/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/chat/confirm-action-dialog";

export interface LinkedDevicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ActiveSession {
  id: string;
  name: string;
  platform: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  type: "desktop" | "mobile";
}

export function LinkedDevicesDialog({
  open,
  onOpenChange,
}: LinkedDevicesDialogProps) {
  const [sessions, setSessions] = useState<ActiveSession[]>([
    {
      id: "s-current",
      name: "Chrome on Windows",
      platform: "Windows 11 · Desktop Web",
      location: "Active session",
      lastActive: "Active now",
      isCurrent: true,
      type: "desktop",
    },
    {
      id: "s-mac",
      name: "Safari on macOS",
      platform: "macOS Sonoma · Desktop Web",
      location: "San Francisco, US",
      lastActive: "Yesterday at 8:15 PM",
      isCurrent: false,
      type: "desktop",
    },
    {
      id: "s-phone",
      name: "Aether Mobile App",
      platform: "iOS 17.5 · iPhone 15 Pro",
      location: "Local Network",
      lastActive: "3 hours ago",
      isCurrent: false,
      type: "mobile",
    },
  ]);

  const [confirmLogoutAllOpen, setConfirmLogoutAllOpen] = useState(false);
  const [loggingOutId, setLoggingOutId] = useState<string | null>(null);

  function handleSignOutSession(id: string) {
    setLoggingOutId(id);
    setTimeout(() => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setLoggingOutId(null);
      toast.success("Device signed out remotely");
    }, 300);
  }

  function handleLogoutAll() {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    setConfirmLogoutAllOpen(false);
    toast.success("Logged out from all other devices");
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
                  Manage active sessions & remote sign-out
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Sessions List */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 space-y-4">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
                Active Sessions
              </p>

              <div className="rounded-xl border border-border/70 bg-card/60 divide-y divide-border/60 overflow-hidden shadow-xs">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid size-9 place-items-center rounded-xl bg-muted border border-border/60 text-muted-foreground shrink-0">
                        {session.type === "desktop" ? (
                          <Laptop className="size-4" />
                        ) : (
                          <Smartphone className="size-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {session.name}
                          </p>
                          {session.isCurrent && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-semibold">
                              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              This device
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {session.platform}
                        </p>
                        <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                          {session.location} · {session.lastActive}
                        </p>
                      </div>
                    </div>

                    {!session.isCurrent && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={loggingOutId === session.id}
                        onClick={() => handleSignOutSession(session.id)}
                        className="h-7 px-2.5 text-xs rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                      >
                        {loggingOutId === session.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <span>Sign out</span>
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {sessions.length > 1 && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmLogoutAllOpen(true)}
                  className="w-full h-9 rounded-xl border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold gap-2"
                >
                  <LogOut className="size-3.5" />
                  <span>Log out from all other devices</span>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={confirmLogoutAllOpen}
        onOpenChange={setConfirmLogoutAllOpen}
        title="Log Out From Other Devices"
        description="Are you sure you want to sign out from all other active sessions? Only this browser session will remain signed in."
        confirmLabel="Log Out Others"
        variant="destructive"
        onConfirm={handleLogoutAll}
      />
    </>
  );
}
