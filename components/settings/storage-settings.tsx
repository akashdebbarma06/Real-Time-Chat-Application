"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Database,
  FileText,
  HardDrive,
  ImageIcon,
  Loader2,
  PieChart,
  RefreshCw,
  Trash2,
  Video,
  Wifi,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/chat/confirm-action-dialog";

export interface StorageSettingsProps {
  onBack: () => void;
}

export function StorageSettings({ onBack }: StorageSettingsProps) {
  const [photoCacheMB, setPhotoCacheMB] = useState(142.5);
  const [videoCacheMB, setVideoCacheMB] = useState(310.2);
  const [filesCacheMB, setFilesCacheMB] = useState(84.8);
  const [clearing, setClearing] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const totalUsedMB = photoCacheMB + videoCacheMB + filesCacheMB;
  const totalAllocatedMB = 1024; // 1 GB simulated cache quota

  // Calculate percentages
  const photoPercent = (photoCacheMB / totalAllocatedMB) * 100;
  const videoPercent = (videoCacheMB / totalAllocatedMB) * 100;
  const filesPercent = (filesCacheMB / totalAllocatedMB) * 100;

  function handleClearCache() {
    setClearing(true);
    setTimeout(() => {
      setPhotoCacheMB(0);
      setVideoCacheMB(0);
      setFilesCacheMB(0);
      setClearing(false);
      setConfirmClearOpen(false);
      toast.success(`Cache cleared! ${totalUsedMB.toFixed(1)} MB freed.`);
    }, 400);
  }

  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none">
        {/* Top Header */}
        <div className="flex items-center gap-2 p-3.5 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-md">
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
            <h3 className="text-sm font-semibold text-foreground truncate">Storage & Data</h3>
            <p className="text-[11px] text-muted-foreground truncate">
              Cache usage, media storage & network
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 space-y-5 pb-28 md:pb-6">
          {/* Section 1: Storage Breakdown Bar */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Device Storage
              </span>
              <span className="text-xs font-semibold text-foreground">
                {totalUsedMB.toFixed(1)} MB / 1.0 GB
              </span>
            </div>

            <div className="rounded-xl border border-border/70 bg-card/60 p-4 space-y-4 shadow-xs">
              {/* Progress bar with color breakdown */}
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
                <div
                  style={{ width: `${photoPercent}%` }}
                  className="bg-emerald-500 h-full transition-all duration-300"
                  title="Photos"
                />
                <div
                  style={{ width: `${videoPercent}%` }}
                  className="bg-purple-500 h-full transition-all duration-300"
                  title="Videos"
                />
                <div
                  style={{ width: `${filesPercent}%` }}
                  className="bg-amber-500 h-full transition-all duration-300"
                  title="Files"
                />
              </div>

              {/* Legend with values */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground truncate">Photos</p>
                    <p className="text-xs font-semibold text-foreground">
                      {photoCacheMB.toFixed(1)} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-purple-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground truncate">Videos</p>
                    <p className="text-xs font-semibold text-foreground">
                      {videoCacheMB.toFixed(1)} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground truncate">Files</p>
                    <p className="text-xs font-semibold text-foreground">
                      {filesCacheMB.toFixed(1)} MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Clear Cache Button */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">Cached Media</p>
                  <p className="text-[11px] text-muted-foreground">
                    Free up local temporary media storage
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={totalUsedMB === 0}
                  onClick={() => setConfirmClearOpen(true)}
                  className="h-8 px-3 rounded-xl gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-border/70 shrink-0"
                >
                  <Trash2 className="size-3.5" />
                  <span>Clear cache</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Section 2: Network Usage */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
              Network Usage
            </p>
            <div className="rounded-xl border border-border/70 bg-card/60 divide-y divide-border/60 overflow-hidden shadow-xs">
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <Wifi className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Data Transferred</p>
                    <p className="text-[11px] text-muted-foreground">Sent 1.2 GB · Received 3.8 GB</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-primary font-mono">5.0 GB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmActionDialog
        open={confirmClearOpen}
        onOpenChange={setConfirmClearOpen}
        title="Clear App Cache"
        description={`Are you sure you want to clear ${totalUsedMB.toFixed(1)} MB of cached photos, videos, and files? Media in messages will reload on demand.`}
        confirmLabel="Clear Cache"
        variant="destructive"
        loading={clearing}
        onConfirm={handleClearCache}
      />
    </>
  );
}
