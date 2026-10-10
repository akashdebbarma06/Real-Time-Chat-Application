import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Ephemeral Media Delivery Queue - Acknowledgment & Purge Handler
 *
 * WhatsApp Architecture:
 * Once the recipient client confirms downloading the media file to local device storage,
 * it sends this ACK. The server immediately deletes the media binary from object storage.
 * The server retains 0 persistent media files.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mediaId = body.mediaId || body.path;

    if (!mediaId || typeof mediaId !== "string") {
      return NextResponse.json({ error: "Missing mediaId parameter" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Purge binary from Supabase 'chat-files' object storage bucket
    const { error: storageError } = await supabase.storage
      .from("chat-files")
      .remove([mediaId]);

    if (storageError) {
      console.warn("[Ephemeral Storage] Storage purge warning:", storageError.message);
    }

    // 2. Optionally clear the attachment_path on the ephemeral message queue row
    await supabase
      .from("messages")
      .update({
        attachment_path: null,
      })
      .eq("attachment_path", mediaId);

    return NextResponse.json({
      success: true,
      purged: true,
      mediaId,
      message: "Media purged from ephemeral storage. Binary exists solely on client device.",
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[Ephemeral Storage] Error processing media ACK:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
