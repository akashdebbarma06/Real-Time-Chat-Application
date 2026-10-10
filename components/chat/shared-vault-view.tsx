"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileArchive,
  FileIcon,
  FileSpreadsheet,
  FileText,
  Globe,
  ImageIcon,
  Link2,
  Loader2,
  Play,
  Search,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { formatConversationTime, formatFileSize } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface SharedMediaItem {
  id: string;
  message_type: "text" | "image" | "file" | "video";
  attachment_path: string;
  attachment_name: string;
  attachment_size: number | null;
  created_at: string;
  url?: string;
  isVideo?: boolean;
}

export interface SharedLinkItem {
  id: string;
  url: string;
  domain: string;
  created_at: string;
  context_text?: string;
}

export interface SharedVaultViewProps {
  conversationId?: string;
  title?: string;
  onBack: () => void;
  initialTab?: "media" | "docs" | "links";
}

export function SharedVaultView({
  conversationId,
  title = "Chat",
  onBack,
  initialTab = "media",
}: SharedVaultViewProps) {
  const [activeTab, setActiveTab] = useState<"media" | "docs" | "links">(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaItems, setMediaItems] = useState<SharedMediaItem[]>([]);
  const [linkItems, setLinkItems] = useState<SharedLinkItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch attachments & links from conversation
  useEffect(() => {
    if (!conversationId) return;

    setLoading(true);
    const supabase = createClient();

    // 1. Fetch attachments
    const fetchAttachments = supabase
      .from("messages")
      .select("id, message_type, attachment_path, attachment_name, attachment_size, created_at")
      .eq("conversation_id", conversationId)
      .not("attachment_path", "is", null)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(60);

    // 2. Fetch messages containing links
    const fetchLinks = supabase
      .from("messages")
      .select("id, content, created_at")
      .eq("conversation_id", conversationId)
      .ilike("content", "%http%")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(60);

    Promise.all([fetchAttachments, fetchLinks])
      .then(async ([attRes, linkRes]) => {
        // Process attachments
        if (attRes.data && attRes.data.length > 0) {
          const withUrls = await Promise.all(
            attRes.data.map(async (row) => {
              let url: string | undefined;
              if (row.attachment_path) {
                const { data: signData } = await supabase.storage
                  .from("chat-files")
                  .createSignedUrl(row.attachment_path, 3600);
                url = signData?.signedUrl;
              }
              const isVideo =
                (row.message_type as string) === "video" ||
                Boolean(row.attachment_name?.match(/\.(mp4|webm|mov|mkv)$/i));

              return {
                ...row,
                url,
                isVideo,
              } as SharedMediaItem;
            })
          );
          setMediaItems(withUrls);
        } else {
          setMediaItems([]);
        }

        // Process links
        if (linkRes.data && linkRes.data.length > 0) {
          const urlRegex = /(https?:\/\/[^\s<]+)/gi;
          const foundLinks: SharedLinkItem[] = [];

          linkRes.data.forEach((msg) => {
            const matches = msg.content?.match(urlRegex);
            if (matches) {
              matches.forEach((rawUrl) => {
                try {
                  // Clean trailing punctuations
                  const cleanUrl = rawUrl.replace(/[.,;!?)]+$/, "");
                  const parsed = new URL(cleanUrl);
                  foundLinks.push({
                    id: `${msg.id}-${cleanUrl}`,
                    url: cleanUrl,
                    domain: parsed.hostname.replace(/^www\./, ""),
                    created_at: msg.created_at,
                    context_text: msg.content.replace(rawUrl, "").trim(),
                  });
                } catch {
                  // Ignore invalid URLs
                }
              });
            }
          });

          setLinkItems(foundLinks);
        } else {
          setLinkItems([]);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [conversationId]);

  // Split media into Photos/Videos vs Docs
  const mediaList = useMemo(() => {
    return mediaItems.filter((item) => {
      const isImg =
        (item.message_type as string) === "image" ||
        Boolean(item.attachment_name?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i));
      const isVid =
        (item.message_type as string) === "video" ||
        Boolean(item.attachment_name?.match(/\.(mp4|webm|mov|mkv)$/i));
      return isImg || isVid;
    });
  }, [mediaItems]);

  const docsList = useMemo(() => {
    return mediaItems.filter((item) => {
      const isImg =
        (item.message_type as string) === "image" ||
        Boolean(item.attachment_name?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i));
      const isVid =
        (item.message_type as string) === "video" ||
        Boolean(item.attachment_name?.match(/\.(mp4|webm|mov|mkv)$/i));
      return !isImg && !isVid;
    });
  }, [mediaItems]);

  // Filter items by search query
  const filteredMedia = useMemo(() => {
    if (!searchQuery.trim()) return mediaList;
    const q = searchQuery.toLowerCase();
    return mediaList.filter((m) => m.attachment_name?.toLowerCase().includes(q));
  }, [mediaList, searchQuery]);

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return docsList;
    const q = searchQuery.toLowerCase();
    return docsList.filter((d) => d.attachment_name?.toLowerCase().includes(q));
  }, [docsList, searchQuery]);

  const filteredLinks = useMemo(() => {
    if (!searchQuery.trim()) return linkItems;
    const q = searchQuery.toLowerCase();
    return linkItems.filter(
      (l) => l.domain.toLowerCase().includes(q) || l.url.toLowerCase().includes(q)
    );
  }, [linkItems, searchQuery]);

  function getDocIcon(filename?: string) {
    if (!filename) return <FileIcon className="size-4" />;
    if (filename.match(/\.pdf$/i)) return <FileText className="size-4 text-rose-500" />;
    if (filename.match(/\.(xlsx?|csv)$/i)) return <FileSpreadsheet className="size-4 text-emerald-500" />;
    if (filename.match(/\.(zip|rar|7z|tar|gz)$/i)) return <FileArchive className="size-4 text-amber-500" />;
    if (filename.match(/\.(docx?|txt|rtf)$/i)) return <FileText className="size-4 text-blue-500" />;
    return <FileIcon className="size-4 text-primary" />;
  }

  return (
    <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none border-r border-border">
      {/* Sticky Header */}
      <div className="flex items-center gap-2 p-3.5 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-md">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          className="rounded-xl size-8 shrink-0 hover:bg-muted"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">Shared Vault</h3>
          <p className="text-[11px] text-muted-foreground truncate">{title}</p>
        </div>
      </div>

      {/* 3-Section Segmented Tab Switcher */}
      <div className="p-3 border-b border-border/60 space-y-2.5">
        <div className="grid grid-cols-3 p-1 rounded-xl bg-muted/60 border border-border/40 gap-1">
          {/* Media Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("media")}
            className={cn(
              "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer",
              activeTab === "media"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ImageIcon className="size-3.5" />
            <span>Media</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-mono">
              {mediaList.length}
            </span>
          </button>

          {/* Docs Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("docs")}
            className={cn(
              "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer",
              activeTab === "docs"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="size-3.5" />
            <span>Docs</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-mono">
              {docsList.length}
            </span>
          </button>

          {/* Links Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("links")}
            className={cn(
              "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer",
              activeTab === "links"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Link2 className="size-3.5" />
            <span>Links</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-mono">
              {linkItems.length}
            </span>
          </button>
        </div>

        {/* Filter Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <Input
            placeholder={
              activeTab === "media"
                ? "Filter photos & videos..."
                : activeTab === "docs"
                  ? "Filter documents & files..."
                  : "Filter shared links..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-7 rounded-xl text-xs bg-muted/40 border-border/60"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5">
        {loading ? (
          <div className="flex h-36 flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>Loading {activeTab}...</span>
          </div>
        ) : activeTab === "media" ? (
          /* 1. Media Section (Photos & Videos) */
          filteredMedia.length > 0 ? (
            <div className="grid grid-cols-3 gap-1.5">
              {filteredMedia.map((item) => (
                <a
                  key={item.id}
                  href={item.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-xl border border-border/70 bg-muted/40 transition hover:opacity-90"
                >
                  {item.isVideo ? (
                    <div className="relative size-full bg-black/80 flex items-center justify-center">
                      {item.url ? (
                        <video
                          src={item.url}
                          preload="metadata"
                          className="size-full object-cover opacity-80"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:scale-110 transition">
                        <div className="size-7 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white">
                          <Play className="size-3.5 fill-current ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/70 text-[9px] text-white font-mono flex items-center gap-0.5">
                        <Video className="size-2.5" />
                      </div>
                    </div>
                  ) : item.url ? (
                    <Image
                      src={item.url}
                      alt={item.attachment_name || "Shared photo"}
                      fill
                      unoptimized
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid size-full place-items-center text-xs text-muted-foreground">
                      <ImageIcon className="size-4" />
                    </div>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border/70 bg-card/40 p-8 text-center space-y-2">
              <div className="size-10 rounded-full bg-muted/60 mx-auto flex items-center justify-center text-muted-foreground">
                <ImageIcon className="size-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">No photos or videos</p>
              <p className="text-[11px] text-muted-foreground">
                Media sent in this chat will show up here.
              </p>
            </div>
          )
        ) : activeTab === "docs" ? (
          /* 2. Docs Section (PDF, DOC, PPTX, ZIP, etc.) */
          filteredDocs.length > 0 ? (
            <div className="space-y-1.5">
              {filteredDocs.map((file) => (
                <a
                  key={file.id}
                  href={file.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={file.attachment_name}
                  className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-card/60 p-2.5 transition hover:bg-muted"
                >
                  <div className="grid size-8 place-items-center rounded-lg bg-muted border border-border/60 shrink-0">
                    {getDocIcon(file.attachment_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {file.attachment_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatFileSize(file.attachment_size)} · {formatConversationTime(file.created_at)}
                    </p>
                  </div>
                  <Download className="size-3.5 text-muted-foreground shrink-0 hover:text-foreground" />
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border/70 bg-card/40 p-8 text-center space-y-2">
              <div className="size-10 rounded-full bg-muted/60 mx-auto flex items-center justify-center text-muted-foreground">
                <FileText className="size-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">No documents</p>
              <p className="text-[11px] text-muted-foreground">
                PDFs, documents, and archives sent in this chat will appear here.
              </p>
            </div>
          )
        ) : (
          /* 3. Links Section (All Shared URLs) */
          filteredLinks.length > 0 ? (
            <div className="space-y-1.5">
              {filteredLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-2.5 rounded-xl border border-border/70 bg-card/60 p-2.5 transition hover:bg-muted"
                >
                  <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0 mt-0.5">
                    <Globe className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-primary truncate">
                        {link.domain}
                      </span>
                      <ExternalLink className="size-2.5 text-muted-foreground group-hover:text-primary transition" />
                    </div>
                    <p className="truncate text-xs text-foreground mt-0.5">
                      {link.url}
                    </p>
                    {link.context_text ? (
                      <p className="truncate text-[10px] text-muted-foreground mt-0.5 italic">
                        &quot;{link.context_text}&quot;
                      </p>
                    ) : null}
                    <p className="text-[10px] text-muted-foreground/80 mt-1">
                      {formatConversationTime(link.created_at)}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border/70 bg-card/40 p-8 text-center space-y-2">
              <div className="size-10 rounded-full bg-muted/60 mx-auto flex items-center justify-center text-muted-foreground">
                <Link2 className="size-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">No shared links</p>
              <p className="text-[11px] text-muted-foreground">
                Links sent in messages will be collected here automatically.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
