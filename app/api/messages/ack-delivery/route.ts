import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Ephemeral Message Delivery Queue - Acknowledgment & Purge Handler
 *
 * Retention Model (Store-and-Forward Relay Architecture):
 * 1. The backend functions as an ephemeral store-and-forward relay.
 * 2. When a recipient client confirms delivery/read of messages, it transmits a delivery ACK.
 * 3. The server authenticates the caller and verifies that the caller is an active member
 *    of the conversation to which the messages belong.
 * 4. Only upon successful verification does the server perform an authorized purge
 *    from the database delivery queue.
 * 5. Success is returned ONLY after the message rows are reliably deleted from the database.
 *    If deletion fails or zero rows are deleted, an error is returned.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    const messageId = body.messageId;
    const rawIds = Array.isArray(body.messageIds)
      ? (body.messageIds as unknown[])
      : messageId
      ? [messageId]
      : [];

    const messageIds: string[] = [];
    for (const id of rawIds) {
      if (typeof id === "string" && UUID_REGEX.test(id.trim())) {
        messageIds.push(id.trim());
      } else {
        return NextResponse.json(
          { error: `Invalid message UUID parameter: ${String(id)}` },
          { status: 400 }
        );
      }
    }

    if (messageIds.length === 0) {
      return NextResponse.json(
        { error: "Missing messageId or messageIds parameter" },
        { status: 400 }
      );
    }

    // 3. Verify messages exist and retrieve their conversation IDs
    const { data: messages, error: fetchError } = await supabase
      .from("messages")
      .select("id, conversation_id")
      .in("id", messageIds);

    if (fetchError) {
      return NextResponse.json(
        { error: `Failed to inspect delivery queue: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "No matching messages found in delivery queue" },
        { status: 404 }
      );
    }

    // 4. Verify caller membership in the target conversations
    const conversationIds = Array.from(new Set(messages.map((m) => m.conversation_id)));

    const { data: memberships, error: memberError } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id)
      .in("conversation_id", conversationIds);

    if (memberError) {
      return NextResponse.json(
        { error: `Failed to verify conversation membership: ${memberError.message}` },
        { status: 500 }
      );
    }

    const memberConvSet = new Set((memberships || []).map((m) => m.conversation_id));
    const unauthorized = messages.filter((m) => !memberConvSet.has(m.conversation_id));

    if (unauthorized.length > 0) {
      return NextResponse.json(
        {
          error: "Forbidden: Caller is not an authorized member of the conversation for one or more messages",
        },
        { status: 403 }
      );
    }

    const authorizedMessageIds = messages.map((m) => m.id);

    // 5. Execute server-authorized deletion
    // Attempt dedicated RPC function first, falling back to direct authorized delete
    let deletedCount = 0;
    const { data: rpcPurged, error: rpcError } = await supabase.rpc(
      "acknowledge_and_purge_messages" as never,
      { p_message_ids: authorizedMessageIds } as never
    );

    if (!rpcError && Array.isArray(rpcPurged)) {
      deletedCount = (rpcPurged as unknown[]).length;
    } else {
      const { data: deletedRows, error: deleteError } = await supabase
        .from("messages")
        .delete()
        .in("id", authorizedMessageIds)
        .select("id");

      if (deleteError) {
        return NextResponse.json(
          { error: `Database purge failed: ${deleteError.message}` },
          { status: 500 }
        );
      }
      deletedCount = deletedRows ? deletedRows.length : 0;
    }

    if (deletedCount === 0) {
      return NextResponse.json(
        { error: "Message purge failed: No rows were deleted from backend delivery queue" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      purged: true,
      purgedCount: deletedCount,
      purgedIds: authorizedMessageIds,
      message: "Messages purged from backend delivery queue. Stored solely on user device.",
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[Ephemeral Queue] Error processing delivery ACK:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
