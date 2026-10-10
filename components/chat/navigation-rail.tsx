"use client";

import Link from "next/link";
import {
  Archive,
  CircleDot,
  FolderOpen,
  Image as ImageIcon,
  MessageCircleMore,
  PhoneCall,
  Settings,
  ShieldCheck,
  User,
  Vault,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppLogo } from "@/components/ui/app-logo";
import { cn, getInitials } from "@/lib/utils";
import { APP_ICONS, useAppearance } from "@/lib/appearance-store";
import type { Profile } from "@/types/chat";

export type RailTab = "chats" | "calls" | "status" | "archive" | "vault" | "media" | "settings";

interface NavigationRailProps {
  profile: Profile;
  activeTab: RailTab;
  onTabChange: (tab: RailTab) => void;
  unreadChatsCount?: number;
}

export function NavigationRail({
  profile,
  activeTab,
  onTabChange,
  unreadChatsCount = 0,
}: NavigationRailProps) {
  const { preferences } = useAppearance();
  const activeAppIcon = APP_ICONS.find((i) => i.id === preferences.appIcon) || APP_ICONS[0];
  const topNavItems: Array<{
    id: RailTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    tooltip: string;
  }> = [
    {
      id: "chats",
      label: "Chats",
      icon: MessageCircleMore,
      badge: unreadChatsCount,
      tooltip: "Active Conversations",
    },
    {
      id: "calls",
      label: "Calls",
      icon: PhoneCall,
      tooltip: "Voice & Video Calls (Preview)",
    },
    {
      id: "status",
      label: "Status",
      icon: CircleDot,
      tooltip: "Stories & Status Updates",
    },
    {
      id: "archive",
      label: "Archive",
      icon: Archive,
      tooltip: "Archived Conversations",
    },
  ];

  const bottomNavItems: Array<{
    id: RailTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    tooltip: string;
  }> = [
    {
      id: "vault",
      label: "Vault",
      icon: Vault,
      tooltip: "Shared Vault (Media, Docs & Links)",
    },
    {
      id: "settings",
      label: "Profile",
      icon: Settings,
      tooltip: "Settings & Profile",
    },
  ];

  return (
    <aside
      className="hidden md:flex w-20 shrink-0 h-full min-h-0 flex-col items-center py-4 border-r border-border/70 bg-card/40 backdrop-blur-xl select-none z-20"
      aria-label="Desktop primary navigation"
    >
      {/* Brand Logo Anchor */}
      <Link
        href="/chat"
        title="Aether Chat"
        aria-label="Aether Chat Home"
        className="group relative mb-4 flex flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
      >
        <div className="size-11 flex items-center justify-center transition-all group-hover:scale-105">
          <AppLogo size={44} />
        </div>
      </Link>

      <div className="w-10 h-px bg-border/60 mb-3" />

      {/* TOP SECTION: Chats, Calls, Status, Archive */}
      <div className="flex flex-col items-center gap-1.5 w-full px-2" role="tablist" aria-orientation="vertical">
        {topNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              aria-label={item.tooltip}
              title={item.tooltip}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-1 w-16 py-2 rounded-2xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isActive
                  ? "bg-primary/15 text-primary font-semibold shadow-xs border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {/* Active Indicator Pill */}
              {isActive && (
                <span
                  className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary shadow-sm shadow-primary/50"
                  aria-hidden="true"
                />
              )}

              <div className="relative">
                <Icon
                  className={cn(
                    "size-5 transition-transform group-hover:scale-110",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* FLEXIBLE SPACER: Anchors bottom items to the viewport base */}
      <div className="flex-1 my-2" />

      {/* BOTTOM SECTION: Media, Profile / Settings */}
      <div className="flex flex-col items-center gap-1.5 w-full px-2" role="tablist" aria-orientation="vertical">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === "vault" && (activeTab as string) === "media");

          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              aria-label={item.tooltip}
              title={item.tooltip}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-1 w-16 py-2 rounded-2xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isActive
                  ? "bg-primary/15 text-primary font-semibold shadow-xs border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {isActive && (
                <span
                  className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary shadow-sm shadow-primary/50"
                  aria-hidden="true"
                />
              )}

              {item.id === "settings" ? (
                <Avatar className="size-6 border border-border group-hover:border-primary transition-colors">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
                  <AvatarFallback className="text-[10px] font-bold uppercase">
                    {(profile.display_name?.trim()[0] || "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Icon
                  className={cn(
                    "size-5 transition-transform group-hover:scale-110",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
              )}

              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
