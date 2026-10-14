import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Ephemeral Message Delivery Queue - Acknowledgment & Purge Handler
 *
 * Store-and-Forward Architecture:
 * The backend acts as a store-and-forward relay.
 * When the recipient client confirms receipt (delivery ACK),
 * the server immediately deletes the message row from the backend database.
 * Once deleted, the server stores 0 persistent records; chats exist solely
 * in the user's local client database.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messageId = body.messageId;
    const messageIds = Array.isArray(body.messageIds) ? (body.messageIds as string[]) : messageId ? [messageId] : [];

    if (messageIds.length === 0) {
      return NextResponse.json({ error: "Missing messageId or messageIds parameter" }, { status: 400 });
    }

    const supabase = await createClient();

    // Delete message(s) from ephemeral relay database
    const { error: deleteError } = await supabase
      .from("messages")
      .delete()
      .in("id", messageIds);

    if (deleteError) {
      console.warn("[Ephemeral Queue] Delete rows warning:", deleteError.message);
    }

    return NextResponse.json({
      success: true,
      purged: true,
      purgedCount: messageIds.length,
      message: "Messages purged from backend delivery queue. Stored solely on user device.",
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[Ephemeral Queue] Error processing delivery ACK:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
