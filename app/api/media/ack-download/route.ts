import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Ephemeral Media Delivery Queue - Acknowledgment & Purge Handler
 *
 * Retention Model (Store-and-Forward Relay Architecture):
 * 1. Media binaries uploaded to Supabase Storage ('chat-files') serve solely as an ephemeral relay buffer.
 * 2. When the recipient client downloads and caches the binary locally in IndexedDB / Device Vault,
 *    it sends an ACK download request.
 * 3. The server authenticates the user and verifies that the user is a confirmed member of the
 *    conversation to which the media belongs.
 * 4. Only upon successful verification does the server purge the binary from object storage
 *    and clear the attachment reference in the database.
 * 5. Success is returned ONLY after the required mutations succeed. If storage deletion
 *    or database clearing fails, an error response is returned.
 */

const UUID_PREFIX_REGEX = /^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/i;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authenticate caller
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized: Active user session required" },
        { status: 401 }
      );
    }

    // 2. Parse and validate input payload
    const body = await req.json().catch(() => ({}));
    const rawMediaId = body.mediaId || body.path;

    if (!rawMediaId || typeof rawMediaId !== "string" || !rawMediaId.trim()) {
      return NextResponse.json(
        { error: "Missing mediaId or path parameter" },
        { status: 400 }
      );
    }

    const mediaPath = rawMediaId.trim();

    // 3. Resolve conversation ID and verify caller membership
    // A) Check if an active message references this attachment path
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("id, conversation_id, attachment_path")
      .eq("attachment_path", mediaPath);

    if (msgError) {
      return NextResponse.json(
        { error: `Failed to query media references: ${msgError.message}` },
        { status: 500 }
      );
    }

    let conversationId: string | null = null;
    if (messages && messages.length > 0) {
      conversationId = messages[0].conversation_id;
    } else {
      // B) If message was already purged, resolve conversation ID from path convention (<conversationId>/...)
      const match = mediaPath.match(UUID_PREFIX_REGEX);
      if (match) {
        conversationId = match[1];
      }
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: "Media attachment not found in delivery queue or invalid storage path" },
        { status: 404 }
      );
    }

    // C) Verify caller is an active member of this conversation
    const { data: membership, error: memberError } = await supabase
      .from("conversation_members")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError) {
      return NextResponse.json(
        { error: `Failed to verify conversation membership: ${memberError.message}` },
        { status: 500 }
      );
    }

    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden: Caller is not an authorized member of the conversation for this media" },
        { status: 403 }
      );
    }

    // 4. Purge binary from Supabase 'chat-files' object storage bucket
    const { data: removeData, error: storageError } = await supabase.storage
      .from("chat-files")
      .remove([mediaPath]);

    if (storageError) {
      return NextResponse.json(
        { error: `Storage purge failed: ${storageError.message}` },
        { status: 500 }
      );
    }

    // 5. Clear the attachment_path on the message row via RPC or direct update
    const { error: rpcError } = await supabase.rpc(
      "acknowledge_and_purge_media" as never,
      { p_media_path: mediaPath } as never
    );

    if (rpcError) {
      const { error: updateError } = await supabase
        .from("messages")
        .update({ attachment_path: null })
        .eq("attachment_path", mediaPath);

      if (updateError) {
        return NextResponse.json(
          { error: `Failed to clear attachment reference: ${updateError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      purged: true,
      mediaId: mediaPath,
      conversationId,
      message: "Media purged from ephemeral storage. Binary exists solely on client device.",
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[Ephemeral Storage] Error processing media ACK:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
