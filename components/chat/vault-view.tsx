"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Download,
  ExternalLink,
  FileArchive,
  FileCode,
  FileIcon,
  FileSpreadsheet,
  FileText,
  Globe,
  ImageIcon,
  Link2,
  Loader2,
  Play,
  Search,
  Vault,
  Video,
  X,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { formatConversationTime, formatFileSize, getConversationTitle } from "@/lib/utils";
import { WhatsAppMediaLightbox } from "@/components/chat/media/whatsapp-media-lightbox";
import { cn } from "@/lib/utils";
import type { ChatMessage, ConversationSummary, Profile } from "@/types/chat";
import { getAllLocalVaultMedia } from "@/lib/storage/local-db";

export interface VaultMediaItem {
  id: string;
  conversation_id: string;
  chat_title: string;
  sender_id: string;
  message_type?: string;
  attachment_path: string;
  attachment_name: string;
  attachment_size: number | null;
  created_at: string;
  url?: string;
  isVideo?: boolean;
}

export interface VaultLinkItem {
  id: string;
  conversation_id: string;
  chat_title: string;
  url: string;
  domain: string;
  title?: string;
  created_at: string;
  context_text?: string;
}

interface VaultViewProps {
  conversations: ConversationSummary[];
  profile: Profile;
}

export function VaultView({ conversations, profile }: VaultViewProps) {
  const [activeTab, setActiveTab] = useState<"media" | "docs" | "links">("media");
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchedMedia, setFetchedMedia] = useState<VaultMediaItem[]>([]);
  const [fetchedDocs, setFetchedDocs] = useState<VaultMediaItem[]>([]);
  const [fetchedLinks, setFetchedLinks] = useState<VaultLinkItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeMediaId, setActiveMediaId] = useState<string | null>(null);
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Map conversation titles
  const conversationTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    conversations.forEach((c) => {
      map.set(c.id, getConversationTitle(c, profile.id));
    });
    return map;
  }, [conversations, profile.id]);

  // Load from Client-Side Persistent Storage (IndexedDB) & Ephemeral Queue
  useEffect(() => {
    let active = true;

    async function loadVault() {
      setLoading(true);

      // 1. WhatsApp Architecture: Load persistent media and files directly from user device IndexedDB
      try {
        const localVault = await getAllLocalVaultMedia();
        if (active && (localVault.media.length > 0 || localVault.docs.length > 0 || localVault.links.length > 0)) {
          setFetchedMedia(localVault.media);
          setFetchedDocs(localVault.docs);
          setFetchedLinks(localVault.links);
          setLoading(false);
        }
      } catch (err) {
        console.warn("[VaultView] Local DB load warning:", err);
      }

      const conversationIds = conversations.map((c) => c.id);
      if (!conversationIds.length) {
        if (active) setLoading(false);
        return;
      }

      // 2. Scan ephemeral queue for any pending unpurged attachments
      const supabase = createClient();

      const fetchAttachments = supabase
        .from("messages")
        .select("id, conversation_id, sender_id, message_type, attachment_path, attachment_name, attachment_size, created_at, content")
        .in("conversation_id", conversationIds)
        .not("attachment_path", "is", null)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(80);

      const fetchLinks = supabase
        .from("messages")
        .select("id, conversation_id, sender_id, content, created_at")
        .in("conversation_id", conversationIds)
        .ilike("content", "%http%")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(80);

      try {
        const [attRes, linkRes] = await Promise.all([fetchAttachments, fetchLinks]);

        if (!active) return;

        if (attRes.data && attRes.data.length > 0) {
          const withUrls: VaultMediaItem[] = await Promise.all(
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

              const chat_title = conversationTitleMap.get(row.conversation_id) || "Chat";

              return {
                ...row,
                chat_title,
                url,
                isVideo,
              } as VaultMediaItem;
            })
          );

          const photosAndVideos = withUrls.filter((item) => {
            const isImg =
              (item.message_type as string) === "image" ||
              Boolean(item.attachment_name?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i));
            return isImg || item.isVideo;
          });

          const documents = withUrls.filter((item) => {
            const isImg =
              (item.message_type as string) === "image" ||
              Boolean(item.attachment_name?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i));
            return !isImg && !item.isVideo;
          });

          setFetchedMedia((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newItems = photosAndVideos.filter((m) => !existingIds.has(m.id));
            return [...prev, ...newItems];
          });

          setFetchedDocs((prev) => {
            const existingIds = new Set(prev.map((d) => d.id));
            const newItems = documents.filter((d) => !existingIds.has(d.id));
            return [...prev, ...newItems];
          });
        }

        if (linkRes.data && linkRes.data.length > 0) {
          const urlRegex = /(https?:\/\/[^\s<]+)/gi;
          const foundLinks: VaultLinkItem[] = [];

          linkRes.data.forEach((msg) => {
            const matches = msg.content?.match(urlRegex);
            if (matches) {
              matches.forEach((rawUrl) => {
                try {
                  const cleanUrl = rawUrl.replace(/[.,;!?)]+$/, "");
                  const parsed = new URL(cleanUrl);
                  const chat_title = conversationTitleMap.get(msg.conversation_id) || "Chat";
                  foundLinks.push({
                    id: `${msg.id}-${cleanUrl}`,
                    conversation_id: msg.conversation_id,
                    chat_title,
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

          setFetchedLinks((prev) => {
            const existingIds = new Set(prev.map((l) => l.id));
            const newLinks = foundLinks.filter((l) => !existingIds.has(l.id));
            return [...prev, ...newLinks];
          });
        }
      } catch (err) {
        console.warn("[VaultView] Ephemeral queue check error:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadVault();

    return () => {
      active = false;
    };
  }, [conversations, conversationTitleMap]);

  // Combined lists
  const mediaList = fetchedMedia;
  const docsList = fetchedDocs;
  const linkList = fetchedLinks;

  // Filter by query (searches item name, chat title, and URL/domain)
  const q = searchQuery.toLowerCase().trim();

  const filteredMedia = useMemo(() => {
    if (!q) return mediaList;
    return mediaList.filter(
      (m) =>
        m.attachment_name?.toLowerCase().includes(q) ||
        m.chat_title?.toLowerCase().includes(q)
    );
  }, [mediaList, q]);

  const filteredDocs = useMemo(() => {
    if (!q) return docsList;
    return docsList.filter(
      (d) =>
        d.attachment_name?.toLowerCase().includes(q) ||
        d.chat_title?.toLowerCase().includes(q)
    );
  }, [docsList, q]);

  const filteredLinks = useMemo(() => {
    if (!q) return linkList;
    return linkList.filter(
      (l) =>
        l.domain.toLowerCase().includes(q) ||
        l.url.toLowerCase().includes(q) ||
        l.chat_title?.toLowerCase().includes(q) ||
        (l.context_text && l.context_text.toLowerCase().includes(q))
    );
  }, [linkList, q]);

  // Transform media items for lightbox
  const lightboxMediaMessages: ChatMessage[] = useMemo(() => {
    return mediaList.map((m) => ({
      id: m.id,
      conversation_id: m.conversation_id,
      sender_id: m.sender_id,
      content: m.attachment_name || "Shared media",
      message_type: (m.isVideo ? "file" : "image") as "file" | "image",
      type: m.isVideo ? "video" : "image",
      attachment_path: m.attachment_path,
      attachment_name: m.attachment_name,
      attachment_size: m.attachment_size,
      created_at: m.created_at,
      edited_at: null,
      deleted_at: null,
      sender: {
        id: m.sender_id,
        username: "user",
        display_name: m.chat_title || "Shared Media",
        avatar_url: null,
        bio: "",
        last_seen_at: m.created_at,
      },
      read_receipts: [],
    }));
  }, [mediaList]);

  function handleOpenLightbox(item: VaultMediaItem) {
    setActiveMediaId(item.id);
    setActiveMediaUrl(item.url || null);
    setActiveConversationId(item.conversation_id);
    setLightboxOpen(true);
  }

  function getDocIcon(filename?: string) {
    if (!filename) return <FileIcon className="size-4" />;
    if (filename.match(/\.pdf$/i)) return <FileText className="size-4 text-rose-500" />;
    if (filename.match(/\.(xlsx?|csv)$/i)) return <FileSpreadsheet className="size-4 text-emerald-500" />;
    if (filename.match(/\.(zip|rar|7z|tar|gz)$/i)) return <FileArchive className="size-4 text-amber-500" />;
    if (filename.match(/\.(docx?|txt|rtf)$/i)) return <FileText className="size-4 text-blue-500" />;
    if (filename.match(/\.(sql|ts|js|json|html|css)$/i)) return <FileCode className="size-4 text-cyan-500" />;
    return <FileIcon className="size-4 text-primary" />;
  }

  return (
    <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none border-r border-border">
      {/* Top Header */}
      <div className="px-5 pt-4 pb-3 border-b border-border/70 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Vault className="size-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">Vault</h2>
              <p className="text-[11px] text-muted-foreground">All shared media, docs & links</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
            Encrypted
          </span>
        </div>

        {/* In-Panel Search Bar */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by name or chat..."
            className="w-full h-8 pl-8 pr-7 rounded-xl text-xs bg-muted/50 border border-border/70 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Clear search"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* 3 Segmented Filter Tabs */}
        <div className="grid grid-cols-3 p-1 mt-3 rounded-xl bg-muted/60 border border-border/40 gap-1">
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
              {filteredMedia.length}
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
              {filteredDocs.length}
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
              {filteredLinks.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
          {loading ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Scanning vault items...</span>
            </div>
          ) : activeTab === "media" ? (
            /* 1. Media Grid (Photos & Videos) */
            filteredMedia.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {filteredMedia.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleOpenLightbox(item)}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-border/70 bg-muted/40 transition hover:border-primary/50 hover:shadow-xs cursor-pointer text-left block"
                    title={`${item.attachment_name} · ${item.chat_title}`}
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
                        <ImageIcon className="size-5" />
                      </div>
                    )}

                    {/* Chat Origin Badge */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] text-white font-semibold truncate leading-tight">
                        {item.chat_title}
                      </p>
                      <p className="text-[9px] text-white/80 truncate">
                        {formatConversationTime(item.created_at)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border/70 bg-card/40 p-8 text-center space-y-2">
                <div className="size-10 rounded-full bg-muted/60 mx-auto flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="size-5" />
                </div>
                <p className="text-xs font-semibold text-foreground">No photos or videos found</p>
                <p className="text-[11px] text-muted-foreground">
                  {searchQuery ? "Try searching with a different term." : "Media sent across your chats will appear here."}
                </p>
              </div>
            )
          ) : activeTab === "docs" ? (
            /* 2. Documents Section */
            filteredDocs.length > 0 ? (
              <div className="space-y-2">
                {filteredDocs.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/60 p-3 transition hover:bg-muted hover:border-primary/40 group"
                  >
                    <div className="grid size-9 place-items-center rounded-xl bg-muted border border-border/60 shrink-0">
                      {getDocIcon(file.attachment_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        {file.attachment_name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                        <span className="font-medium text-foreground/80">{file.chat_title}</span>
                        <span>·</span>
                        <span>{formatFileSize(file.attachment_size)}</span>
                        <span>·</span>
                        <span>{formatConversationTime(file.created_at)}</span>
                      </div>
                    </div>
                    <a
                      href={file.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={file.attachment_name}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition"
                      title="Download file"
                    >
                      <Download className="size-4" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border/70 bg-card/40 p-8 text-center space-y-2">
                <div className="size-10 rounded-full bg-muted/60 mx-auto flex items-center justify-center text-muted-foreground">
                  <FileText className="size-5" />
                </div>
                <p className="text-xs font-semibold text-foreground">No documents found</p>
                <p className="text-[11px] text-muted-foreground">
                  {searchQuery ? "Try searching with a different term." : "PDFs, archives, and docs will be indexed here."}
                </p>
              </div>
            )
          ) : (
            /* 3. Links Section */
            filteredLinks.length > 0 ? (
              <div className="space-y-2">
                {filteredLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 rounded-xl border border-border/70 bg-card/60 p-3 transition hover:bg-muted hover:border-primary/40 block text-left"
                  >
                    <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 mt-0.5">
                      <Globe className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-primary truncate">
                          {link.domain}
                        </span>
                        <ExternalLink className="size-3 text-muted-foreground group-hover:text-primary transition" />
                      </div>
                      <p className="truncate text-xs text-foreground mt-0.5 font-medium">
                        {link.title || link.url}
                      </p>
                      {link.context_text ? (
                        <p className="truncate text-[10px] text-muted-foreground mt-0.5 italic">
                          &quot;{link.context_text}&quot;
                        </p>
                      ) : null}
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/80 mt-1">
                        <span className="font-medium text-foreground/70">{link.chat_title}</span>
                        <span>·</span>
                        <span>{formatConversationTime(link.created_at)}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border/70 bg-card/40 p-8 text-center space-y-2">
                <div className="size-10 rounded-full bg-muted/60 mx-auto flex items-center justify-center text-muted-foreground">
                  <Link2 className="size-5" />
                </div>
                <p className="text-xs font-semibold text-foreground">No shared links found</p>
                <p className="text-[11px] text-muted-foreground">
                  {searchQuery ? "Try searching with a different term." : "URLs sent in conversations will appear here."}
                </p>
              </div>
            )
          )}
        </div>
      </ScrollArea>

      {/* Full-Screen Media Lightbox */}
      <WhatsAppMediaLightbox
        open={lightboxOpen}
        activeMessageId={activeMediaId}
        initialUrl={activeMediaUrl}
        conversationMediaMessages={lightboxMediaMessages}
        currentUserId={profile.id}
        conversationId={activeConversationId || "vault"}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
