"use client";

import { useId } from "react";
import { AppLogo } from "@/components/ui/app-logo";
import { cn } from "@/lib/utils";

export interface BrandedLoadingScreenProps {
  message?: string;
  showProgress?: boolean;
  fullScreen?: boolean;
  className?: string;
}

export function BrandedLoadingScreen({
  message = "Loading AetherChat...",
  showProgress = true,
  fullScreen = true,
  className,
}: BrandedLoadingScreenProps) {
  const rawId = useId();
  const gradId = `loader-grad-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading AetherChat"
      className={cn(
        "flex flex-col items-center justify-center bg-background text-foreground select-none transition-all duration-300",
        fullScreen
          ? "fixed inset-0 z-50 h-screen h-[100dvh] w-screen safe-area-pt safe-area-pb"
          : "h-full w-full min-h-[320px] py-12",
        className
      )}
    >
      {/* ── Brand Logo & Animated Accent Ring ── */}
      <div className="relative flex items-center justify-center">
        {/* Ambient Subtle Purple Glow Aura */}
        <div
          aria-hidden="true"
          className="absolute -inset-6 rounded-full bg-primary/20 blur-2xl animate-pulse motion-reduce:animate-none pointer-events-none"
        />

        {/* Animated Purple Gradient Accent Ring */}
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          className="absolute -inset-3.5 size-[96px] animate-spin motion-reduce:animate-none [animation-duration:2.4s] pointer-events-none"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.85" />
              <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="60 180"
          />
        </svg>

        {/* Crisp AetherChat Logo */}
        <div className="relative z-10 transition-transform duration-300 transform-gpu">
          <AppLogo size={68} />
        </div>
      </div>

      {/* ── Brand Title ── */}
      <div className="mt-7 text-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          AetherChat
        </h1>

        {/* Contextual Status Subtitle */}
        {message && (
          <p className="mt-1.5 text-xs font-medium text-muted-foreground transition-opacity duration-200">
            {message}
          </p>
        )}
      </div>

      {/* ── Smooth Horizontal Indeterminate Progress Bar ── */}
      {showProgress && (
        <div
          aria-hidden="true"
          className="mt-5 h-1 w-36 overflow-hidden rounded-full bg-muted/60"
        >
          <div className="h-full w-full origin-left bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse motion-reduce:animate-none" />
        </div>
      )}
    </div>
  );
}
