"use client";

import { ExternalLink, MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

/**
 * Parses structured JSON location messages or legacy text location messages.
 */
export function parseLocationMessage(content?: string | null): LocationData | null {
  if (!content) return null;
  const trimmed = content.trim();

  // 1. Try structured JSON format
  if (trimmed.startsWith("{") && trimmed.includes('"type"') && trimmed.includes('"location"')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (
        parsed.type === "location" &&
        typeof parsed.latitude === "number" &&
        typeof parsed.longitude === "number"
      ) {
        if (
          parsed.latitude >= -90 &&
          parsed.latitude <= 90 &&
          parsed.longitude >= -180 &&
          parsed.longitude <= 180
        ) {
          return {
            latitude: parsed.latitude,
            longitude: parsed.longitude,
            address: parsed.address || undefined,
          };
        }
      }
    } catch {}
  }

  // 2. Try legacy formatted text: 📍 **Location Shared**\nLatitude: ... Longitude: ...
  const legacyRegex = /📍\s*\*\*Location Shared\*\*[\s\S]*?Latitude:\s*([-\d.]+),\s*Longitude:\s*([-\d.]+)/i;
  const match = trimmed.match(legacyRegex);
  if (match) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return {
        latitude: lat,
        longitude: lon,
      };
    }
  }

  return null;
}

export function LocationCard({
  latitude,
  longitude,
  address,
  own,
}: {
  latitude: number;
  longitude: number;
  address?: string;
  own?: boolean;
}) {
  const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "my-1.5 flex flex-col overflow-hidden rounded-2xl border transition-all w-full max-w-[280px] sm:max-w-[320px] shadow-sm bg-card text-card-foreground select-none",
        own ? "border-primary/40 ring-1 ring-primary/20" : "border-border/80"
      )}
    >
      {/* Map Thumbnail Graphic Header */}
      <div className="relative h-32 w-full overflow-hidden bg-slate-900 dark:bg-slate-950 flex items-center justify-center">
        {/* Rendered static map image thumbnail */}
        <img
          src={`https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=15&size=400x200&maptype=mapnik`}
          alt={address || `Location at ${latitude}, ${longitude}`}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "0";
          }}
        />
        {/* Soft vignette to ensure pin and pill readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/30 pointer-events-none" />

        {/* Centered Overlay Pin */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="grid size-10 place-items-center rounded-full bg-red-500/20 text-red-500 ring-4 ring-red-500/30 shadow-md">
            <MapPin className="size-5 text-red-500 fill-red-500" />
          </div>
        </div>

        {/* High-contrast Coordinates Pill */}
        <div className="absolute bottom-2 right-2 rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-mono text-white shadow-xs backdrop-blur-xs z-10">
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </div>
      </div>

      {/* Info & Action Footer */}
      <div className="flex flex-col gap-2.5 p-3.5 bg-card text-card-foreground">
        <div className="flex items-start gap-2.5">
          <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mt-0.5">
            <MapPin className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold leading-tight text-foreground truncate">
              {address || "Shared Location"}
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-mono truncate">
              {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </p>
          </div>
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2 px-3 text-xs font-semibold transition-all cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99] shadow-xs"
        >
          <Navigation className="size-3.5" />
          <span>Open in Maps</span>
          <ExternalLink className="size-3 opacity-70 ml-0.5" />
        </a>
      </div>
    </div>
  );
}
