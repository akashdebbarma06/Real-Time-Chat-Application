"use client";

import { MessageCircleMore, Settings } from "lucide-react";
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
  // Production focused mobile bottom nav: [Chats, Settings] (Calls & Status pruned while in preview)
  const items: Array<{
    id: RailTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: "chats", label: "Chats", icon: MessageCircleMore, badge: unreadChatsCount },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 w-full bg-[#0F1115]/90 dark:bg-[#0F1115]/90 backdrop-blur-md border-t border-white/[0.07] pb-[max(env(safe-area-inset-bottom,0px),var(--safe-area-bottom,0px))] z-40 select-none flex items-center justify-around px-6 py-2 transition-colors"
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
              "relative flex flex-col items-center justify-center py-1 px-6 text-xs transition-colors cursor-pointer",
              isActive
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={item.label}
          >
            <div className="relative">
              <Icon
                className={cn(
                  "size-5 transition-transform duration-150",
                  isActive ? "text-primary scale-105" : "text-muted-foreground"
                )}
              />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[8px] font-bold text-primary-foreground shadow-xs">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] tracking-tight mt-1">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
