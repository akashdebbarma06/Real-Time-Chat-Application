import { NextRequest, NextResponse } from "next/server";
import dns from "node:dns/promises";
import net from "node:net";

export interface LinkMetadata {
  url: string;
  domain: string;
  siteName?: string;
  title?: string;
  description?: string;
  image?: string;
}

// ─────────────────────────────────────────────────────────────
// 1. BOUNDED IN-MEMORY CACHE (LRU + TTL)
// ─────────────────────────────────────────────────────────────
interface CacheEntry {
  data: LinkMetadata;
  expiresAt: number;
}

const MAX_CACHE_ENTRIES = 500;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
export const previewCache = new Map<string, CacheEntry>();

export function getFromCache(url: string): LinkMetadata | null {
  const entry = previewCache.get(url);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    previewCache.delete(url);
    return null;
  }
  // Move to end for LRU order
  previewCache.delete(url);
  previewCache.set(url, entry);
  return entry.data;
}

export function setInCache(url: string, data: LinkMetadata): void {
  const now = Date.now();
  if (previewCache.has(url)) {
    previewCache.delete(url);
  } else if (previewCache.size >= MAX_CACHE_ENTRIES) {
    // 1. Evict expired entries
    for (const [k, v] of previewCache.entries()) {
      if (v.expiresAt <= now) {
        previewCache.delete(k);
      }
    }
    // 2. If still at capacity, evict oldest entry (first key in map)
    if (previewCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = previewCache.keys().next().value;
      if (oldestKey) previewCache.delete(oldestKey);
    }
  }

  previewCache.set(url, {
    data,
    expiresAt: now + CACHE_TTL_MS,
  });
}

// ─────────────────────────────────────────────────────────────
// 2. RATE LIMITER (In-Memory Sliding Window per IP)
// ─────────────────────────────────────────────────────────────
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute per IP
const MAX_RATE_LIMIT_ENTRIES = 2000;
export const rateLimitMap = new Map<string, RateLimitBucket>();

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();

  // Prune expired buckets if map exceeds threshold
  if (rateLimitMap.size > MAX_RATE_LIMIT_ENTRIES) {
    for (const [key, bucket] of rateLimitMap.entries()) {
      if (bucket.resetAt <= now) {
        rateLimitMap.delete(key);
      }
    }
  }

  let bucket = rateLimitMap.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(ip, bucket);
    return { allowed: true };
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  bucket.count += 1;
  return { allowed: true };
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") || "unknown-client";
}

// ─────────────────────────────────────────────────────────────
// 3. ROBUST IP AND SSRF VALIDATION
// ─────────────────────────────────────────────────────────────

/**
 * Validates whether an IPv4 address is in a private, loopback, or reserved range.
 */
export function isPrivateOrReservedIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // malformed treated as unsafe
  }

  const [a, b, c, d] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private)
  if (a === 10) return true;

  // 100.64.0.0/10 (Shared Address Space / CGNAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 169.254.0.0/16 (Link-Local, cloud instance metadata)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (Private)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (a === 192 && b === 0 && c === 0) return true;

  // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 0 && c === 2) return true;

  // 192.88.99.0/24 (6to4 Relay Anycast)
  if (a === 192 && b === 88 && c === 99) return true;

  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;

  // 198.18.0.0/15 (Benchmarking)
  if (a === 198 && (b === 18 || b === 19)) return true;

  // 198.51.100.0/24 (TEST-NET-2)
  if (a === 198 && b === 51 && c === 100) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (a === 203 && b === 0 && c === 113) return true;

  // 224.0.0.0/4 (Multicast)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved / Future Use)
  if (a >= 240) return true;

  // 255.255.255.255 (Broadcast)
  if (a === 255 && b === 255 && c === 255 && d === 255) return true;

  return false;
}

/**
 * Validates whether an IPv6 address is in a private, loopback, or reserved range.
 */
export function isPrivateOrReservedIPv6(ip: string): boolean {
  const norm = ip.toLowerCase().trim();

  // Unspecified and loopback
  if (norm === "::" || norm === "::1" || norm === "0:0:0:0:0:0:0:0" || norm === "0:0:0:0:0:0:0:1") {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:127.0.0.1 or ::ffff:7f00:1)
  const ipv4MappedMatch = norm.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (ipv4MappedMatch) {
    return isPrivateOrReservedIPv4(ipv4MappedMatch[1]);
  }

  // IPv4-compatible IPv6 (deprecated, ::x.x.x.x)
  const ipv4CompatMatch = norm.match(/^::(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (ipv4CompatMatch) {
    return isPrivateOrReservedIPv4(ipv4CompatMatch[1]);
  }

  // Link-Local unicast (fe80::/10 -> fe80 to febf)
  if (/^fe[89ab][0-9a-f]:/i.test(norm) || norm.startsWith("fe80::")) {
    return true;
  }

  // Unique Local Addresses (fc00::/7 -> fc00 to fdff)
  if (/^f[cd][0-9a-f]{2}:/i.test(norm) || norm.startsWith("fc00::") || norm.startsWith("fd00::")) {
    return true;
  }

  // Multicast (ff00::/8)
  if (norm.startsWith("ff")) {
    return true;
  }

  // Documentation prefix (2001:db8::/32)
  if (norm.startsWith("2001:db8:") || norm === "2001:db8::") {
    return true;
  }

  // Discard prefix (100::/64)
  if (norm.startsWith("100::")) {
    return true;
  }

  // 6to4 prefix (2002::/16) - embeds IPv4 in words 2 and 3
  if (norm.startsWith("2002:")) {
    const parts = norm.split(":");
    if (parts.length >= 3) {
      const w1 = parseInt(parts[1], 16);
      const w2 = parseInt(parts[2], 16);
      if (!isNaN(w1) && !isNaN(w2)) {
        const ip4 = `${(w1 >> 8) & 0xff}.${w1 & 0xff}.${(w2 >> 8) & 0xff}.${w2 & 0xff}`;
        return isPrivateOrReservedIPv4(ip4);
      }
    }
    return true;
  }

  return false;
}

/**
 * Checks if a given IP address is private, loopback, or reserved.
 */
export function isPrivateOrReservedIP(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) {
    return isPrivateOrReservedIPv4(ip);
  }
  if (version === 6) {
    return isPrivateOrReservedIPv6(ip);
  }
  return true; // Not a valid IP -> consider unsafe
}

/**
 * Checks URL syntax and basic host safety before DNS resolution.
 */
export function isSyntacticallySafeUrl(parsed: URL): boolean {
  // 1. Protocol must strictly be http: or https:
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false;
  }

  // 2. Reject credentials in URL (SSRF vector)
  if (parsed.username || parsed.password) {
    return false;
  }

  // 3. Port must strictly be default or 80/443 (prevents internal port scanning)
  if (parsed.port && parsed.port !== "80" && parsed.port !== "443") {
    return false;
  }

  const host = parsed.hostname.toLowerCase().trim();

  // 4. Reject empty or single-label hostnames (e.g. "localhost", "intranet", "router")
  if (!host || !host.includes(".") && host !== "localhost") {
    return false;
  }

  // 5. Reject well-known internal/reserved hostnames
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".lan") ||
    host.endsWith(".home") ||
    host.endsWith(".corp") ||
    host.endsWith(".test") ||
    host.endsWith(".example") ||
    host.endsWith(".invalid") ||
    host === "metadata.google.internal" ||
    host === "instance-data"
  ) {
    return false;
  }

  // 6. If hostname is already an IP literal, validate it immediately
  if (net.isIP(host)) {
    if (isPrivateOrReservedIP(host)) {
      return false;
    }
  }

  return true;
}

/**
 * Resolves the DNS records of a hostname and ensures ALL returned IP addresses are public.
 */
export async function resolveAndValidateHost(hostname: string): Promise<boolean> {
  const cleanHost = hostname.toLowerCase().trim();

  // If already an IP address
  if (net.isIP(cleanHost)) {
    return !isPrivateOrReservedIP(cleanHost);
  }

  try {
    const records = await dns.lookup(cleanHost, { all: true, verbatim: true });
    if (!records || records.length === 0) {
      return false;
    }

    // Every resolved record (IPv4 and IPv6) must be public
    for (const record of records) {
      if (isPrivateOrReservedIP(record.address)) {
        return false;
      }
    }

    return true;
  } catch {
    // DNS resolution failure
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// 4. SANITIZATION HELPERS
// ─────────────────────────────────────────────────────────────
function sanitizeText(str: string, maxLength: number): string {
  return str
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/[\r\n\t]+/g, " ")
    .trim()
    .slice(0, maxLength);
}

// ─────────────────────────────────────────────────────────────
// 5. MAIN ROUTE HANDLER WITH SAFE REDIRECT LOOP & BOUNDED DEADLINE
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  // 1. Rate limiting
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds || 60),
        },
      }
    );
  }

  // 2. Query param parsing
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing 'url' query parameter" }, { status: 400 });
  }

  let currentUrlParsed: URL;
  try {
    currentUrlParsed = new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  if (!isSyntacticallySafeUrl(currentUrlParsed)) {
    return NextResponse.json(
      { error: "URL destination is blocked by SSRF security policy" },
      { status: 403 }
    );
  }

  const initialCleanUrl = currentUrlParsed.toString();

  // 3. Cache lookup
  const cached = getFromCache(initialCleanUrl);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
    });
  }

  // 4. Overall request and body deadline (5000ms strictly enforced across entire lifecycle)
  const controller = new AbortController();
  const overallTimeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    let currentUrl = initialCleanUrl;
    let redirectCount = 0;
    const MAX_REDIRECTS = 5;
    let response: Response | null = null;
    let finalUrlParsed = currentUrlParsed;

    while (redirectCount <= MAX_REDIRECTS) {
      // Validate destination host via DNS before making the connection
      const hostIsSafe = await resolveAndValidateHost(finalUrlParsed.hostname);
      if (!hostIsSafe) {
        return NextResponse.json(
          { error: "Destination host resolved to a private or reserved network address" },
          { status: 403 }
        );
      }

      // Fetch with manual redirect to prevent blind SSRF jumps
      const res = await fetch(currentUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; AetherBot/1.0; +https://chatsphere-tan.vercel.app)",
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "manual",
      });

      // Handle HTTP redirects (301, 302, 303, 307, 308)
      if (res.status >= 300 && res.status < 400) {
        const locationHeader = res.headers.get("location");
        if (!locationHeader) {
          return NextResponse.json({ error: "Redirect missing Location header" }, { status: 422 });
        }

        redirectCount++;
        if (redirectCount > MAX_REDIRECTS) {
          return NextResponse.json({ error: "Too many redirects" }, { status: 422 });
        }

        let nextUrlParsed: URL;
        try {
          nextUrlParsed = new URL(locationHeader, currentUrl);
        } catch {
          return NextResponse.json({ error: "Invalid redirect Location format" }, { status: 422 });
        }

        if (!isSyntacticallySafeUrl(nextUrlParsed)) {
          return NextResponse.json(
            { error: "Redirect target violates SSRF policy" },
            { status: 403 }
          );
        }

        currentUrl = nextUrlParsed.toString();
        finalUrlParsed = nextUrlParsed;
        continue;
      }

      response = res;
      break;
    }

    if (!response) {
      return NextResponse.json({ error: "Failed to establish connection" }, { status: 502 });
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream request failed with status ${response.status}` },
        { status: 422 }
      );
    }

    // 5. Verify Content-Length cap before body reading
    const contentLengthHeader = response.headers.get("content-length");
    if (contentLengthHeader) {
      const contentLength = parseInt(contentLengthHeader, 10);
      if (!isNaN(contentLength) && contentLength > 2 * 1024 * 1024) {
        return NextResponse.json({ error: "Response body too large" }, { status: 413 });
      }
    }

    // 6. Content-Type check: Only parse HTML
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      const fallbackMetadata: LinkMetadata = {
        url: initialCleanUrl,
        domain: finalUrlParsed.hostname.replace(/^www\./, ""),
        title: finalUrlParsed.hostname,
      };
      setInCache(initialCleanUrl, fallbackMetadata);
      return NextResponse.json(fallbackMetadata, {
        headers: { "Cache-Control": "public, max-age=3600" },
      });
    }

    // 7. Stream and cap body bytes to max 512KB
    const reader = response.body?.getReader();
    let html = "";
    const MAX_BYTES = 512 * 1024;

    if (reader) {
      const decoder = new TextDecoder("utf-8");
      let bytesRead = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          bytesRead += value.byteLength;
          html += decoder.decode(value, { stream: true });
          if (bytesRead >= MAX_BYTES || html.includes("</head>")) {
            await reader.cancel().catch(() => {});
            break;
          }
        }
      } catch (streamErr) {
        if (controller.signal.aborted) {
          throw streamErr;
        }
      }
    } else {
      html = await response.text();
      if (html.length > MAX_BYTES) {
        html = html.slice(0, MAX_BYTES);
      }
    }

    // 8. Extract OpenGraph / Meta information
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
    const siteName = getMeta("og:site_name") || finalUrlParsed.hostname;

    let imageUrl: string | undefined = undefined;
    if (rawImage) {
      try {
        const parsedImg = new URL(rawImage, currentUrl);
        if (isSyntacticallySafeUrl(parsedImg)) {
          imageUrl = parsedImg.toString();
        }
      } catch {}
    }

    const metadata: LinkMetadata = {
      url: initialCleanUrl,
      domain: finalUrlParsed.hostname.replace(/^www\./, ""),
      siteName: siteName ? sanitizeText(siteName, 50) : undefined,
      title: rawTitle ? sanitizeText(rawTitle, 120) : finalUrlParsed.hostname,
      description: rawDesc ? sanitizeText(rawDesc, 200) : undefined,
      image: imageUrl,
    };

    // Store in bounded cache
    setInCache(initialCleanUrl, metadata);

    return NextResponse.json(metadata, {
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
    });
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      { error: isTimeout ? "Request timed out" : "Failed to fetch metadata" },
      { status: isTimeout ? 504 : 502 }
    );
  } finally {
    clearTimeout(overallTimeoutId);
  }
}
