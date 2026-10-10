"use client";

import { CircleDot, MessageCircleMore, PhoneCall, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RailTab } from "@/components/chat/navigation-rail";

interface MobileBottomNavProps {
  activeTab: RailTab;
  onTabChange: (tab: RailTab) => void;
  unreadChatsCount?: number;
}

export function MobileBottomNav({
  activeTab,
  onTabChange,
  unreadChatsCount = 0,
}: MobileBottomNavProps) {
  // Mobile bottom navigation has exactly 4 items: Chats, Calls, Status, Account (Vault is desktop-only)
  const items: Array<{
    id: RailTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: "chats", label: "Chats", icon: MessageCircleMore, badge: unreadChatsCount },
    { id: "calls", label: "Calls", icon: PhoneCall },
    { id: "status", label: "Status", icon: CircleDot },
    { id: "settings", label: "Account", icon: User },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-4 inset-x-0 max-w-sm mx-auto w-[calc(100%-2rem)] rounded-full bg-[#182229]/80 backdrop-blur-xl border border-white/10 shadow-lg z-40 select-none flex items-center justify-around px-3 py-2"
      aria-label="Mobile navigation"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={cn(
              "group relative flex flex-col items-center justify-center py-1 px-3.5 rounded-full transition-all duration-200 text-xs cursor-pointer",
              isActive
                ? "text-primary scale-105 font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            )}
            aria-label={item.label}
          >
            <div className="relative">
              <Icon
                className={cn(
                  "size-5 transition-transform duration-200",
                  isActive ? "scale-110 text-primary" : "text-zinc-400"
                )}
              />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[8px] font-bold text-primary-foreground shadow-xs">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            {isActive && (
              <span
                className="size-1 rounded-full bg-primary shadow-[0_0_8px_currentColor] mt-0.5 animate-pulse"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
