import { NextRequest, NextResponse } from "next/server";

interface LinkMetadata {
  url: string;
  domain: string;
  siteName?: string;
  title?: string;
  description?: string;
  image?: string;
}

// In-memory cache for fast link preview responses
const previewCache = new Map<string, { data: LinkMetadata; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Validates whether an IP address is in a private, loopback, or reserved range (SSRF guard).
 */
function isPrivateOrReservedIP(ip: string): boolean {
  // IPv4 checks
  const ipv4Match = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 127) return true; // Loopback 127.0.0.0/8
    if (a === 10) return true; // Private 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // Private 172.16.0.0/12
    if (a === 192 && b === 168) return true; // Private 192.168.0.0/16
    if (a === 169 && b === 254) return true; // Link-local 169.254.0.0/16
    if (a >= 224) return true; // Multicast & broadcast
    return false;
  }

  // IPv6 checks
  const normalized = ip.toLowerCase();
  if (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fc00:") ||
    normalized.startsWith("fd00:")
  ) {
    return true;
  }

  return false;
}

/**
 * Validates URL safety against SSRF attacks.
 */
function isSafeUrl(parsed: URL): boolean {
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false;
  }

  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return false;
  }

  if (isPrivateOrReservedIP(host)) {
    return false;
  }

  return true;
}

function sanitizeText(str: string, maxLength: number): string {
  return str
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/[\r\n\t]+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing 'url' query parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  if (!isSafeUrl(parsed)) {
    return NextResponse.json(
      { error: "URL destination is blocked by SSRF security policy" },
      { status: 403 }
    );
  }

  const cleanUrl = parsed.toString();

  // Check in-memory cache
  const cached = previewCache.get(cleanUrl);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data, {
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(cleanUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AetherBot/1.0; +https://chatsphere-tan.vercel.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream request failed with status ${res.status}` },
        { status: 422 }
      );
    }

    // Verify response URL after any redirects
    const finalUrl = new URL(res.url);
    if (!isSafeUrl(finalUrl)) {
      return NextResponse.json(
        { error: "Redirect target violates SSRF policy" },
        { status: 403 }
      );
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      return NextResponse.json(
        {
          url: cleanUrl,
          domain: finalUrl.hostname,
          title: finalUrl.hostname,
        },
        { headers: { "Cache-Control": "public, max-age=3600" } }
      );
    }

    // Read max 512KB to protect server memory
    const reader = res.body?.getReader();
    let html = "";
    if (reader) {
      const decoder = new TextDecoder("utf-8");
      let bytesRead = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done || bytesRead > 512 * 1024) break;
        bytesRead += value.byteLength;
        html += decoder.decode(value, { stream: true });
        if (html.includes("</head>")) break;
      }
    } else {
      html = await res.text();
    }

    // Extract OpenGraph / Meta information
    const getMeta = (prop: string): string | undefined => {
      const match =
        html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i")) ||
        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i"));
      return match ? match[1] : undefined;
    };

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const rawTitle = getMeta("og:title") || getMeta("twitter:title") || (titleMatch ? titleMatch[1] : undefined);
    const rawDesc = getMeta("og:description") || getMeta("description") || getMeta("twitter:description");
    const rawImage = getMeta("og:image") || getMeta("twitter:image");
    const siteName = getMeta("og:site_name") || finalUrl.hostname;

    let imageUrl: string | undefined = undefined;
    if (rawImage) {
      try {
        const parsedImg = new URL(rawImage, cleanUrl);
        if (isSafeUrl(parsedImg)) {
          imageUrl = parsedImg.toString();
        }
      } catch {}
    }

    const metadata: LinkMetadata = {
      url: cleanUrl,
      domain: finalUrl.hostname.replace(/^www\./, ""),
      siteName: siteName ? sanitizeText(siteName, 50) : undefined,
      title: rawTitle ? sanitizeText(rawTitle, 120) : finalUrl.hostname,
      description: rawDesc ? sanitizeText(rawDesc, 200) : undefined,
      image: imageUrl,
    };

    // Cache the result
    previewCache.set(cleanUrl, {
      data: metadata,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return NextResponse.json(metadata, {
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      { error: isTimeout ? "Request timed out" : "Failed to fetch metadata" },
      { status: 504 }
    );
  }
}
