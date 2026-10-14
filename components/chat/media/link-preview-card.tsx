"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ExternalLink, Globe } from "lucide-react";

interface LinkMetadata {
  url: string;
  domain: string;
  siteName?: string;
  title?: string;
  description?: string;
  image?: string;
}

const clientPreviewCache = new Map<string, LinkMetadata>();

export function LinkPreviewCard({ url, own }: { url: string; own?: boolean }) {
  const [data, setData] = useState<LinkMetadata | null>(() => clientPreviewCache.get(url) || null);
  const [loading, setLoading] = useState(() => !clientPreviewCache.has(url));

  useEffect(() => {
    if (clientPreviewCache.has(url)) {
      setData(clientPreviewCache.get(url)!);
      setLoading(false);
      return;
    }

    let active = true;
    const controller = new AbortController();

    async function fetchPreview() {
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          if (active) setLoading(false);
          return;
        }
        const json = await res.json();
        if (json && json.title) {
          clientPreviewCache.set(url, json);
          if (active) {
            setData(json);
            setLoading(false);
          }
        } else {
          if (active) setLoading(false);
        }
      } catch {
        if (active) setLoading(false);
      }
    }

    void fetchPreview();

    return () => {
      active = false;
      controller.abort();
    };
  }, [url]);

  if (loading || !data || !data.title) {
    return null;
  }

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`mt-2 flex flex-col overflow-hidden rounded-xl border transition-all hover:opacity-95 ${
        own
          ? "border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground"
          : "border-border bg-card/75 text-foreground hover:bg-card"
      }`}
    >
      {data.image && (
        <div className="relative h-36 w-full overflow-hidden bg-muted/40">
          <img
            src={data.image}
            alt={data.title}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = "none";
            }}
          />
        </div>
      )}
      <div className="flex flex-col gap-1 p-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium opacity-75">
          <Globe className="size-3 shrink-0" />
          <span className="truncate">{data.domain || data.siteName}</span>
          <ExternalLink className="size-2.5 shrink-0 ml-auto opacity-60" />
        </div>
        <h4 className="text-xs font-semibold line-clamp-1 leading-snug">{data.title}</h4>
        {data.description && (
          <p className="text-[11px] opacity-80 line-clamp-2 leading-relaxed">{data.description}</p>
        )}
      </div>
    </a>
  );
}
