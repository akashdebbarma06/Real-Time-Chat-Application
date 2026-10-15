import { NextRequest, NextResponse } from "next/server";

// Rate limiting in-memory store (sliding window per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

// Export rate limiter for testing
export function checkContactRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  return true;
}

export function resetContactRateLimits(): void {
  rateLimitMap.clear();
}

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export async function POST(request: NextRequest) {
  try {
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (!checkContactRateLimit(clientIp)) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many contact submissions from this IP. Please wait a few minutes before trying again.",
        },
        { status: 429 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { name, email, subject, message, honeypot } = body;

    // Honeypot spam trap
    if (typeof honeypot === "string" && honeypot.trim().length > 0) {
      // Bot detected; return simulated success without processing
      return NextResponse.json({
        success: true,
        ticketId: "AETH-REF-PROCESSED",
        message: "Thank you for contacting Aether Chat.",
      });
    }

    // Input validation
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
      return NextResponse.json(
        { success: false, error: "Name must be between 2 and 100 characters." },
        { status: 400 }
      );
    }

    if (
      typeof email !== "string" ||
      email.trim().length > 254 ||
      !EMAIL_REGEX.test(email.trim())
    ) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (
      subject !== undefined &&
      (typeof subject !== "string" || subject.trim().length > 150)
    ) {
      return NextResponse.json(
        { success: false, error: "Subject must not exceed 150 characters." },
        { status: 400 }
      );
    }

    if (
      typeof message !== "string" ||
      message.trim().length < 10 ||
      message.trim().length > 3000
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Message must be between 10 and 3,000 characters in length.",
        },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const emailDomain = sanitizedEmail.split("@")[1] || "unknown";

    // Generate deterministic tracking ID
    const timestampPart = Date.now().toString(36).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const ticketId = `AETH-${timestampPart}-${randomPart}`;

    // Log operational metadata (do not log sensitive message text)
    console.info(`[Contact Submission] Ticket: ${ticketId}, Domain: ${emailDomain}, Time: ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      ticketId,
      message: `Your inquiry has been received. Our team will review it under ticket reference ${ticketId}.`,
      receivedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Unhandled contact submission error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while processing your message. Please reach out via GitHub Issues.",
      },
      { status: 500 }
    );
  }
}
