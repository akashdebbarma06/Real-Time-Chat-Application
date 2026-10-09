"use client";

import {
  BarChart2,
  Calendar,
  FileText,
  ImageIcon,
  MapPin,
  User,
} from "lucide-react";

interface AttachmentGridMenuProps {
  onSelectGallery: () => void;
  onSelectLocation: () => void;
  onSelectContact: () => void;
  onSelectDocument: () => void;
  onSelectPoll: () => void;
  onSelectEvent: () => void;
}

const ATTACHMENT_ITEMS = [
  {
    id: "gallery",
    label: "Gallery",
    icon: ImageIcon,
    gradient: "from-purple-600 to-fuchsia-500 shadow-purple-500/25",
  },
  {
    id: "location",
    label: "Location",
    icon: MapPin,
    gradient: "from-blue-600 to-sky-500 shadow-blue-500/25",
  },
  {
    id: "contact",
    label: "Contact",
    icon: User,
    gradient: "from-cyan-500 to-teal-400 shadow-cyan-500/25",
  },
  {
    id: "document",
    label: "Document",
    icon: FileText,
    gradient: "from-indigo-600 to-violet-500 shadow-indigo-500/25",
  },
  {
    id: "poll",
    label: "Poll",
    icon: BarChart2,
    gradient: "from-emerald-600 to-green-500 shadow-emerald-500/25",
  },
  {
    id: "event",
    label: "Event",
    icon: Calendar,
    gradient: "from-rose-500 to-amber-500 shadow-rose-500/25",
  },
] as const;

export function AttachmentGridMenu({
  onSelectGallery,
  onSelectLocation,
  onSelectContact,
  onSelectDocument,
  onSelectPoll,
  onSelectEvent,
}: AttachmentGridMenuProps) {
  function handleClick(id: string) {
    switch (id) {
      case "gallery":
        onSelectGallery();
        break;
      case "location":
        onSelectLocation();
        break;
      case "contact":
        onSelectContact();
        break;
      case "document":
        onSelectDocument();
        break;
      case "poll":
        onSelectPoll();
        break;
      case "event":
        onSelectEvent();
        break;
    }
  }

  return (
    <div
      role="menu"
      aria-label="Attachment options"
      className="absolute bottom-full right-4 sm:right-16 mb-3 z-30 w-72 sm:w-80 rounded-3xl border border-white/20 dark:border-white/10 bg-background/85 dark:bg-card/90 backdrop-blur-2xl p-4 shadow-2xl shadow-black/10 dark:shadow-black/40 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200"
    >
      <div className="grid grid-cols-3 gap-y-4 gap-x-2">
        {ATTACHMENT_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleClick(item.id)}
              className="group flex flex-col items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl p-1.5 transition-all cursor-pointer"
            >
              <div
                className={`grid size-13 place-items-center rounded-full bg-gradient-to-tr ${item.gradient} text-white shadow-lg transition-transform duration-200 group-hover:scale-110 group-active:scale-95`}
              >
                <Icon className="size-6 drop-shadow-sm" />
              </div>
              <span className="text-xs font-medium text-foreground tracking-tight group-hover:text-primary transition-colors">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
