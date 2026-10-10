"use client";

import { useId } from "react";
import {
  useAppearance,
  APP_ICONS,
  ACCENT_COLORS,
  type AppIconChoice,
} from "@/lib/appearance-store";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  size?: number | string;
  className?: string;
  color?: string;
  iconChoice?: AppIconChoice;
}

export function AppLogo({ size = 44, className, color, iconChoice }: AppLogoProps) {
  const { preferences } = useAppearance();
  const rawId = useId();
  // Safe sanitized ID for SVG gradient reference
  const gradientId = `app-logo-grad-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const chosenIconId = iconChoice || preferences.appIcon;
  const currentAppIcon = APP_ICONS.find((i) => i.id === chosenIconId) || APP_ICONS[0];
  const currentAccent =
    ACCENT_COLORS.find((c) => c.id === preferences.accentColor) || ACCENT_COLORS[0];

  const useSolid = Boolean(color);
  const solidColor = color || currentAccent.hex;
  const [c1, c2, c3] = currentAppIcon.stops;
  const dotColor = useSolid ? solidColor : currentAppIcon.dotColor;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      width={size}
      height={size}
      className={cn("shrink-0 transition-all duration-300", className)}
      aria-label="Aether Chat Logo"
    >
      {!useSolid && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="50%" stopColor={c2} />
            <stop offset="100%" stopColor={c3} />
          </linearGradient>
        </defs>
      )}

      {/* Dynamic Rounded Squircle */}
      <rect
        width="128"
        height="128"
        rx="36"
        fill={useSolid ? solidColor : `url(#${gradientId})`}
      />

      {/* Centered Clean White Chat Bubble */}
      <path
        d="M34 38C34 29.1634 41.1634 22 50 22H78C86.8366 22 94 29.1634 94 38V64C94 72.8366 86.8366 80 78 80H54.5L38.8 91.8C37.2 92.9 34 91.8 34 89.5V80C34 80 34 80 34 80V38Z"
        fill="#FFFFFF"
      />

      {/* Three Horizontal Centered Conversation Dots */}
      <circle cx="51" cy="51" r="5" fill={dotColor} />
      <circle cx="64" cy="51" r="5" fill={dotColor} />
      <circle cx="77" cy="51" r="5" fill={dotColor} />
    </svg>
  );
}
