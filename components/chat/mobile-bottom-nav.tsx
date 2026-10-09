"use client";

import { CircleDot, Image as ImageIcon, MessageCircleMore, PhoneCall, User } from "lucide-react";
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
  const items: Array<{
    id: RailTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: "chats", label: "Chats", icon: MessageCircleMore, badge: unreadChatsCount },
    { id: "calls", label: "Calls", icon: PhoneCall },
    { id: "status", label: "Status", icon: CircleDot },
    { id: "media", label: "Media", icon: ImageIcon },
    { id: "settings", label: "Account", icon: User },
  ];

  return (
    <nav
      className="md:hidden flex items-center justify-around border-t border-border bg-card/90 backdrop-blur-xl px-2 py-1.5 z-30 select-none shadow-lg"
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
              "flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition-all text-xs",
              isActive
                ? "text-purple-600 dark:text-purple-400 font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={item.label}
          >
            <div className="relative">
              <Icon
                className={cn(
                  "size-5 transition-transform",
                  isActive ? "scale-110 text-purple-600 dark:text-purple-400" : "text-muted-foreground"
                )}
              />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-purple-600 px-1 text-[8px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
