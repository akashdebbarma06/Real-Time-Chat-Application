"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Database,
  FileText,
  HardDrive,
  ImageIcon,
  Loader2,
  RefreshCw,
  RotateCcw,
  Trash2,
  Video,
  Wifi,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/chat/confirm-action-dialog";
import { cn } from "@/lib/utils";
import {
  clearLocalMediaCache,
  getLocalMediaStorageBreakdown,
  type LocalMediaStorageBreakdown,
} from "@/lib/storage/local-db";

export interface StorageSettingsProps {
  onBack: () => void;
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes <= 0 || isNaN(bytes)) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeI = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, safeI)).toFixed(dm))} ${sizes[safeI]}`;
}

export function StorageSettings({ onBack }: StorageSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // Live storage manager state
  const [usageBytes, setUsageBytes] = useState(0);
  const [quotaBytes, setQuotaBytes] = useState(0);
  const [isPersistent, setIsPersistent] = useState(false);

  // IndexedDB media breakdown
  const [photoBytes, setPhotoBytes] = useState(0);
  const [videoBytes, setVideoBytes] = useState(0);
  const [fileBytes, setFileBytes] = useState(0);
  const [databaseBytes, setDatabaseBytes] = useState(0);

  // Network usage metrics
  const [netSent, setNetSent] = useState(0);
  const [netReceived, setNetReceived] = useState(0);

  // Dynamic storage query via Storage Manager API and Local DB
  const loadStorageMetrics = useCallback(async () => {
    try {
      let liveUsage = 0;
      let liveQuota = 0;
      let persistedState = false;

      // 1. Query disk usage on the device using Storage Manager API
      if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.estimate) {
        try {
          const estimate = await navigator.storage.estimate();
          liveUsage = estimate.usage || 0;
          liveQuota = estimate.quota || 0;
        } catch (err) {
          console.warn("[StorageSettings] StorageManager estimate failed:", err);
        }

        if (navigator.storage.persisted) {
          try {
            persistedState = await navigator.storage.persisted();
          } catch {}
        }
      }

      // 2. Query IndexedDB media breakdown
      const breakdown: LocalMediaStorageBreakdown = await getLocalMediaStorageBreakdown();
      const mediaSum = breakdown.totalMediaBytes;

      // Ensure effective usage accounts for all locally cached media & db entries
      const effectiveUsage = Math.max(liveUsage, mediaSum);
      const appDbBytes = Math.max(0, effectiveUsage - mediaSum);

      setUsageBytes(effectiveUsage);
      setQuotaBytes(liveQuota);
      setIsPersistent(persistedState);

      setPhotoBytes(breakdown.photoBytes);
      setVideoBytes(breakdown.videoBytes);
      setFileBytes(breakdown.fileBytes);
      setDatabaseBytes(appDbBytes);

      // 3. Load dynamic network usage
      if (typeof window !== "undefined") {
        const sent = parseInt(localStorage.getItem("aether_network_sent_bytes") || "0", 10);
        const recv = parseInt(localStorage.getItem("aether_network_received_bytes") || "0", 10);
        setNetSent(isNaN(sent) ? 0 : sent);
        setNetReceived(isNaN(recv) ? 0 : recv);
      }
    } catch (err) {
      console.error("[StorageSettings] Error querying local storage:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadStorageMetrics();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadStorageMetrics]);

  // Dynamic percentages calculation
  const totalCachedMedia = photoBytes + videoBytes + fileBytes;
  const denominator = usageBytes > 0 ? usageBytes : 1;
  const photoPercent = usageBytes > 0 ? (photoBytes / denominator) * 100 : 0;
  const videoPercent = usageBytes > 0 ? (videoBytes / denominator) * 100 : 0;
  const filesPercent = usageBytes > 0 ? (fileBytes / denominator) * 100 : 0;
  const dbPercent = usageBytes > 0 ? (databaseBytes / denominator) * 100 : 0;

  async function handleClearCache() {
    setClearing(true);
    try {
      const freed = await clearLocalMediaCache();
      await loadStorageMetrics();
      setConfirmClearOpen(false);
      toast.success(
        freed > 0
          ? `Cache cleared! ${formatBytes(freed)} freed.`
          : "Cache cleared! Local media storage is now empty."
      );
    } catch (err) {
      console.error("[StorageSettings] Failed to clear local cache:", err);
      toast.error("Failed to clear local cache.");
    } finally {
      setClearing(false);
    }
  }

  function handleResetNetworkStats() {
    if (typeof window !== "undefined") {
      localStorage.setItem("aether_network_sent_bytes", "0");
      localStorage.setItem("aether_network_received_bytes", "0");
      setNetSent(0);
      setNetReceived(0);
      toast.success("Network statistics reset.");
    }
  }

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
              <h3 className="text-sm font-semibold text-foreground truncate">Storage & Data</h3>
              <p className="text-[11px] text-muted-foreground truncate">
                Cache usage, media storage & network
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => loadStorageMetrics()}
            disabled={loading}
            className="rounded-xl size-8 shrink-0 hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Refresh storage metrics"
            aria-label="Refresh storage metrics"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin text-primary")} />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 space-y-5 pb-28 md:pb-6">
          {/* Section 1: Storage Breakdown Bar */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Device Storage
                </span>
                {isPersistent && (
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Persistent
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-foreground">
                {formatBytes(usageBytes)}{" "}
                {quotaBytes > 0 ? `/ ${formatBytes(quotaBytes)}` : ""}
              </span>
            </div>

            <div className="rounded-xl border border-border/70 bg-card/60 p-4 space-y-4 shadow-xs">
              {/* Progress bar with live color breakdown */}
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
                {usageBytes > 0 ? (
                  <>
                    <div
                      style={{ width: `${photoPercent}%` }}
                      className="bg-emerald-500 h-full transition-all duration-300"
                      title={`Photos: ${formatBytes(photoBytes)}`}
                    />
                    <div
                      style={{ width: `${videoPercent}%` }}
                      className="bg-purple-500 h-full transition-all duration-300"
                      title={`Videos: ${formatBytes(videoBytes)}`}
                    />
                    <div
                      style={{ width: `${filesPercent}%` }}
                      className="bg-amber-500 h-full transition-all duration-300"
                      title={`Files: ${formatBytes(fileBytes)}`}
                    />
                    <div
                      style={{ width: `${dbPercent}%` }}
                      className="bg-sky-500 h-full transition-all duration-300"
                      title={`Database & Messages: ${formatBytes(databaseBytes)}`}
                    />
                  </>
                ) : (
                  <div className="h-full w-full bg-muted" />
                )}
              </div>

              {/* Legend with live values */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground truncate">Photos</p>
                    <p className="text-xs font-semibold text-foreground">
                      {formatBytes(photoBytes)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-purple-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground truncate">Videos</p>
                    <p className="text-xs font-semibold text-foreground">
                      {formatBytes(videoBytes)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground truncate">Files</p>
                    <p className="text-xs font-semibold text-foreground">
                      {formatBytes(fileBytes)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-sky-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground truncate">Database</p>
                    <p className="text-xs font-semibold text-foreground">
                      {formatBytes(databaseBytes)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Clear Cache Button */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">Cached Media</p>
                  <p className="text-[11px] text-muted-foreground">
                    Free up local temporary media storage
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={totalCachedMedia === 0 && usageBytes === 0}
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
            <div className="flex items-center justify-between px-0.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Network Usage
              </p>
              {(netSent > 0 || netReceived > 0) && (
                <button
                  type="button"
                  onClick={handleResetNetworkStats}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="size-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
            <div className="rounded-xl border border-border/70 bg-card/60 divide-y divide-border/60 overflow-hidden shadow-xs">
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <Wifi className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Data Transferred</p>
                    <p className="text-[11px] text-muted-foreground">
                      Sent {formatBytes(netSent)} · Received {formatBytes(netReceived)}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-primary font-mono">
                  {formatBytes(netSent + netReceived)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmActionDialog
        open={confirmClearOpen}
        onOpenChange={setConfirmClearOpen}
        title="Clear Cache"
        description={`Are you sure you want to clear ${formatBytes(totalCachedMedia || usageBytes)} of locally cached photos, videos, and files? Media in messages will reload on demand.`}
        confirmLabel="Clear Cache"
        variant="destructive"
        loading={clearing}
        onConfirm={handleClearCache}
      />
    </>
  );
}
