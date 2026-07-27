"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, FileText, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatFileSize } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

export function AttachmentPreview({ message }: { message: ChatMessage }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!message.attachment_path) return;
    let active = true;
    void createClient().storage.from("chat-files").createSignedUrl(message.attachment_path, 3600).then(({ data }) => {
      if (active) setUrl(data?.signedUrl || null);
    });
    return () => { active = false; };
  }, [message.attachment_path]);

  if (!url) return <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground"><Loader2 className="size-4 animate-spin" />Preparing attachment…</div>;

  if (message.message_type === "image") {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="mt-2 block overflow-hidden rounded-xl border bg-muted/40">
        <div className="relative aspect-[4/3] max-h-80 min-h-48 w-full min-w-56 sm:min-w-72">
          <Image src={url} alt={message.attachment_name || "Shared image"} fill unoptimized className="object-cover transition-transform duration-300 hover:scale-[1.02]" sizes="(max-width: 640px) 75vw, 420px" />
        </div>
      </a>
    );
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className="mt-2 flex min-w-60 items-center gap-3 rounded-xl border bg-background/65 p-3 transition hover:bg-background">
      <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><FileText className="size-5" /></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{message.attachment_name || "Attachment"}</span><span className="block text-xs text-muted-foreground">{formatFileSize(message.attachment_size)}</span></span>
      <Download className="size-4 text-muted-foreground" />
    </a>
  );
}
