"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Disc,
  MessageSquare,
  Phone,
  Users,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { playNotificationSound, requestNotificationPermission } from "@/lib/notifications";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export type NotificationSubMenu = "messages" | "groups" | "status" | "calls" | null;

interface NotificationSettingsProps {
  onBack: () => void;
}

export function NotificationSettings({ onBack }: NotificationSettingsProps) {
  const [activeSubMenu, setActiveSubMenu] = useState<NotificationSubMenu>(null);

  // Global Toggles
  const [showPreviews, setShowPreviews] = useState(true);
  const [outgoingSound, setOutgoingSound] = useState(false);
  const [bgSync, setBgSync] = useState(true);

  // Category States
  const [messagesEnabled, setMessagesEnabled] = useState(true);
  const [messagesTone, setMessagesTone] = useState("Default");
  const [messagesReactions, setMessagesReactions] = useState(true);

  const [groupsEnabled, setGroupsEnabled] = useState(true);
  const [groupsTone, setGroupsTone] = useState("Chime");
  const [groupsReactions, setGroupsReactions] = useState(true);

  const [statusEnabled, setStatusEnabled] = useState(true);

  const [callsEnabled, setCallsEnabled] = useState(true);
  const [callsRingtone, setCallsRingtone] = useState("Default");
  const [callsVibrate, setCallsVibrate] = useState(true);

  const sendTestNotification = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Browser notifications are not supported on this device");
      return;
    }

    if (Notification.permission === "granted") {
      try {
        new Notification("Test Notification", {
          body: "Notifications are working properly!",
          icon: "/favicon.ico",
        });
        playNotificationSound();
        toast.success("Test notification dispatched");
      } catch (err) {
        toast.error("Could not trigger desktop notification: " + String(err));
      }
    } else {
      const granted = await requestNotificationPermission();
      if (granted) {
        new Notification("Test Notification", {
          body: "Notifications are working properly!",
          icon: "/favicon.ico",
        });
        playNotificationSound();
        toast.success("Permission granted & test notification sent!");
      } else {
        toast.error("Notification permission denied in browser settings");
      }
    }
  };

  const tones = ["Default", "Chime", "Bell", "Pop", "Ping", "Silent"];

  // ── SUB-PANEL: Messages ──
  if (activeSubMenu === "messages") {
    return (
      <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none">
        <div className="flex items-center gap-3 p-3.5 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-md">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setActiveSubMenu(null)}
            className="rounded-xl size-8 shrink-0 hover:bg-muted"
            aria-label="Back to notification settings"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">Messages</h3>
            <p className="text-[11px] text-muted-foreground truncate">Alerts & tones for direct messages</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5 space-y-4 pb-28 md:pb-6">
          <div className="flex items-center justify-between rounded-2xl border bg-card/60 p-3.5 shadow-xs">
            <div className="pr-4">
              <p className="text-sm font-medium text-foreground">Message notifications</p>
              <p className="text-xs text-muted-foreground">Show alerts for new incoming direct messages</p>
            </div>
            <Switch checked={messagesEnabled} onCheckedChange={setMessagesEnabled} />
          </div>

          <div className="rounded-2xl border bg-card/60 p-3.5 space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2">
              <Volume2 className="size-4 text-primary" />
              <p className="text-xs font-semibold text-foreground">Message Tone</p>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {tones.map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => {
                    setMessagesTone(tone);
                    if (tone !== "Silent") playNotificationSound();
                  }}
                  className={cn(
                    "rounded-xl py-2 text-[11px] font-semibold transition-all cursor-pointer",
                    messagesTone === tone
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border bg-card/60 p-3.5 shadow-xs">
            <div className="pr-4">
              <p className="text-sm font-medium text-foreground">Reaction notifications</p>
              <p className="text-xs text-muted-foreground">Show alerts when someone reacts to your messages</p>
            </div>
            <Switch checked={messagesReactions} onCheckedChange={setMessagesReactions} />
          </div>
        </div>
      </div>
    );
  }

  // ── SUB-PANEL: Groups ──
  if (activeSubMenu === "groups") {
    return (
      <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none">
        <div className="flex items-center gap-3 p-3.5 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-md">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setActiveSubMenu(null)}
            className="rounded-xl size-8 shrink-0 hover:bg-muted"
            aria-label="Back to notification settings"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">Groups</h3>
            <p className="text-[11px] text-muted-foreground truncate">Alerts & tones for group chats</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5 space-y-4 pb-28 md:pb-6">
          <div className="flex items-center justify-between rounded-2xl border bg-card/60 p-3.5 shadow-xs">
            <div className="pr-4">
              <p className="text-sm font-medium text-foreground">Group notifications</p>
              <p className="text-xs text-muted-foreground">Show alerts for new incoming group messages</p>
            </div>
            <Switch checked={groupsEnabled} onCheckedChange={setGroupsEnabled} />
          </div>

          <div className="rounded-2xl border bg-card/60 p-3.5 space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2">
              <Volume2 className="size-4 text-primary" />
              <p className="text-xs font-semibold text-foreground">Group Tone</p>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {tones.map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => {
                    setGroupsTone(tone);
                    if (tone !== "Silent") playNotificationSound();
                  }}
                  className={cn(
                    "rounded-xl py-2 text-[11px] font-semibold transition-all cursor-pointer",
                    groupsTone === tone
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border bg-card/60 p-3.5 shadow-xs">
            <div className="pr-4">
              <p className="text-sm font-medium text-foreground">Group reaction notifications</p>
              <p className="text-xs text-muted-foreground">Show alerts when members react in group chats</p>
            </div>
            <Switch checked={groupsReactions} onCheckedChange={setGroupsReactions} />
          </div>
        </div>
      </div>
    );
  }

  // ── SUB-PANEL: Status ──
  if (activeSubMenu === "status") {
    return (
      <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none">
        <div className="flex items-center gap-3 p-3.5 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-md">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setActiveSubMenu(null)}
            className="rounded-xl size-8 shrink-0 hover:bg-muted"
            aria-label="Back to notification settings"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">Status</h3>
            <p className="text-[11px] text-muted-foreground truncate">Alerts for contact status updates</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5 space-y-4 pb-28 md:pb-6">
          <div className="flex items-center justify-between rounded-2xl border bg-card/60 p-3.5 shadow-xs">
            <div className="pr-4">
              <p className="text-sm font-medium text-foreground">Status update notifications</p>
              <p className="text-xs text-muted-foreground">Receive alerts when contacts publish new stories or status updates</p>
            </div>
            <Switch checked={statusEnabled} onCheckedChange={setStatusEnabled} />
          </div>
        </div>
      </div>
    );
  }

  // ── SUB-PANEL: Calls ──
  if (activeSubMenu === "calls") {
    return (
      <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none">
        <div className="flex items-center gap-3 p-3.5 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-md">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setActiveSubMenu(null)}
            className="rounded-xl size-8 shrink-0 hover:bg-muted"
            aria-label="Back to notification settings"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">Calls</h3>
            <p className="text-[11px] text-muted-foreground truncate">Ringtones & alerts for audio & video calls</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5 space-y-4 pb-28 md:pb-6">
          <div className="flex items-center justify-between rounded-2xl border bg-card/60 p-3.5 shadow-xs">
            <div className="pr-4">
              <p className="text-sm font-medium text-foreground">Call alerts</p>
              <p className="text-xs text-muted-foreground">Show alerts for incoming voice and video calls</p>
            </div>
            <Switch checked={callsEnabled} onCheckedChange={setCallsEnabled} />
          </div>

          <div className="rounded-2xl border bg-card/60 p-3.5 space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2">
              <Volume2 className="size-4 text-primary" />
              <p className="text-xs font-semibold text-foreground">Ringtone</p>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {tones.map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => {
                    setCallsRingtone(tone);
                    if (tone !== "Silent") playNotificationSound();
                  }}
                  className={cn(
                    "rounded-xl py-2 text-[11px] font-semibold transition-all cursor-pointer",
                    callsRingtone === tone
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border bg-card/60 p-3.5 shadow-xs">
            <div className="pr-4">
              <p className="text-sm font-medium text-foreground">Vibrate</p>
              <p className="text-xs text-muted-foreground">Vibrate on incoming call ring</p>
            </div>
            <Switch checked={callsVibrate} onCheckedChange={setCallsVibrate} />
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN NOTIFICATION SETTINGS PANEL ──
  const categoryNavItems = [
    { id: "messages" as const, label: "Messages", state: messagesEnabled ? "On" : "Off", icon: MessageSquare },
    { id: "groups" as const, label: "Groups", state: groupsEnabled ? "On" : "Off", icon: Users },
    { id: "status" as const, label: "Status", state: statusEnabled ? "On" : "Off", icon: Disc },
    { id: "calls" as const, label: "Calls", state: callsEnabled ? "On" : "Off", icon: Phone },
  ];

  return (
    <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none">
      {/* Header */}
      <div className="flex items-center gap-3 p-3.5 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-md">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          className="rounded-xl size-8 shrink-0 hover:bg-muted text-foreground"
          aria-label="Back to settings"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">Notifications</h2>
          <p className="text-[11px] text-muted-foreground truncate">Alerts, tones & background sync</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5 space-y-4 pb-28 md:pb-6">
        {/* 1. Category Navigation Rows */}
        <div className="rounded-2xl border border-border bg-card/60 divide-y divide-border overflow-hidden shadow-xs">
          {categoryNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSubMenu(item.id)}
                className="flex items-center justify-between w-full py-3.5 px-4 hover:bg-muted transition-colors group text-left cursor-pointer"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <Icon className="text-muted-foreground group-hover:text-foreground shrink-0 size-5" />
                  <div className="min-w-0">
                    <p className="text-[15px] font-normal text-foreground leading-snug">{item.label}</p>
                    <p className="text-xs text-muted-foreground font-normal mt-0.5">{item.state}</p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-2" />
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-px bg-border my-2" />

        {/* 2. Global Toggle Switches */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-4 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="pr-2 min-w-0">
              <p className="text-[15px] font-normal text-foreground leading-snug">Show previews</p>
              <p className="text-xs text-muted-foreground mt-0.5">Preview message text inside message notifications.</p>
            </div>
            <Switch
              checked={showPreviews}
              onCheckedChange={setShowPreviews}
              aria-label="Show previews"
            />
          </div>

          <div className="h-px bg-border/60" />

          <div className="flex items-center justify-between gap-3">
            <div className="pr-2 min-w-0">
              <p className="text-[15px] font-normal text-foreground leading-snug">Play sound for outgoing messages</p>
              <p className="text-xs text-muted-foreground mt-0.5">Audible click tone when your messages deliver.</p>
            </div>
            <Switch
              checked={outgoingSound}
              onCheckedChange={setOutgoingSound}
              aria-label="Play sound for outgoing messages"
            />
          </div>

          <div className="h-px bg-border/60" />

          <div className="flex items-center justify-between gap-3">
            <div className="pr-2 min-w-0">
              <p className="text-[15px] font-normal text-foreground leading-snug">Background sync</p>
              <p className="text-xs text-muted-foreground mt-0.5">Get faster performance by syncing messages in the background.</p>
            </div>
            <Switch
              checked={bgSync}
              onCheckedChange={setBgSync}
              aria-label="Background sync"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border my-2" />

        {/* 3. Diagnostic & System Permission note */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[15px] font-normal text-foreground leading-snug">Send test notification</p>
              <p className="text-xs text-muted-foreground mt-0.5">Verify browser and audio permission setup</p>
            </div>
            <button
              type="button"
              onClick={sendTestNotification}
              className="px-4 py-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-full transition-colors cursor-pointer shrink-0"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed pt-1">
            To get notifications, make sure they&apos;re allowed in your browser and device settings.
          </p>
        </div>
      </div>
    </div>
  );
}
