"use client";

import { ExternalLink, MapPin, Navigation } from "lucide-react";

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
      className={`my-1.5 flex flex-col overflow-hidden rounded-2xl border transition-all max-w-[280px] sm:max-w-[320px] shadow-sm ${
        own
          ? "border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground"
          : "border-border bg-card/85 text-foreground"
      }`}
    >
      {/* Map Graphic Preview Header */}
      <div className="relative h-32 w-full overflow-hidden bg-slate-900 flex items-center justify-center">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(#00a884 1px, transparent 1px), linear-gradient(90deg, #00a884 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        {/* Centered Pulsing Marker */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="grid size-11 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 ring-4 ring-emerald-500/30 animate-pulse">
            <MapPin className="size-6 text-emerald-400 fill-emerald-400/30" />
          </div>
        </div>
        {/* Coordinates Pill */}
        <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-mono text-white/90 backdrop-blur-xs">
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </div>
      </div>

      {/* Info & Action Footer */}
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-start gap-2">
          <MapPin className="size-4 shrink-0 text-emerald-500 mt-0.5" />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold leading-tight truncate">
              {address || "Live Location"}
            </h4>
            <p className="text-[11px] opacity-75 truncate">
              Coordinates: {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </p>
          </div>
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-1.5 w-full rounded-xl py-2 px-3 text-xs font-semibold transition-all cursor-pointer ${
            own
              ? "bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
              : "bg-primary/10 hover:bg-primary/20 text-primary"
          }`}
        >
          <Navigation className="size-3.5" />
          <span>Open in Maps</span>
          <ExternalLink className="size-3 opacity-60 ml-0.5" />
        </a>
      </div>
    </div>
  );
}
