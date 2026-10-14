import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  isPrivateOrReservedIPv4,
  isPrivateOrReservedIPv6,
  isPrivateOrReservedIP,
  isSyntacticallySafeUrl,
  resolveAndValidateHost,
  checkRateLimit,
  rateLimitMap,
  previewCache,
  getFromCache,
  setInCache,
  GET,
} from "@/app/api/link-preview/route";
import dns from "node:dns/promises";

describe("Link-Preview Route SSRF Protection & Hardening Suite", () => {
  beforeEach(() => {
    rateLimitMap.clear();
    previewCache.clear();
    vi.restoreAllMocks();
  });

  describe("1. IPv4 Private, Loopback, & Reserved Range Validation", () => {
    it("blocks loopback addresses (127.0.0.0/8)", () => {
      expect(isPrivateOrReservedIPv4("127.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv4("127.1.2.3")).toBe(true);
      expect(isPrivateOrReservedIPv4("127.255.255.255")).toBe(true);
    });

    it("blocks RFC 1918 private subnets", () => {
      // 10.0.0.0/8
      expect(isPrivateOrReservedIPv4("10.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv4("10.254.1.1")).toBe(true);

      // 172.16.0.0/12
      expect(isPrivateOrReservedIPv4("172.16.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv4("172.24.5.6")).toBe(true);
      expect(isPrivateOrReservedIPv4("172.31.255.255")).toBe(true);
      // 172.32.0.1 is public
      expect(isPrivateOrReservedIPv4("172.32.0.1")).toBe(false);

      // 192.168.0.0/16
      expect(isPrivateOrReservedIPv4("192.168.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv4("192.168.100.254")).toBe(true);
    });

    it("blocks cloud instance metadata & link-local addresses (169.254.0.0/16)", () => {
      expect(isPrivateOrReservedIPv4("169.254.169.254")).toBe(true); // AWS / GCP / Azure IMDS
      expect(isPrivateOrReservedIPv4("169.254.0.1")).toBe(true);
    });

    it("blocks CGNAT, current network, multicast, and broadcast addresses", () => {
      expect(isPrivateOrReservedIPv4("0.0.0.0")).toBe(true);
      expect(isPrivateOrReservedIPv4("100.64.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv4("100.127.255.255")).toBe(true);
      expect(isPrivateOrReservedIPv4("192.0.2.1")).toBe(true); // TEST-NET-1
      expect(isPrivateOrReservedIPv4("224.0.0.1")).toBe(true); // Multicast
      expect(isPrivateOrReservedIPv4("240.0.0.1")).toBe(true); // Reserved
      expect(isPrivateOrReservedIPv4("255.255.255.255")).toBe(true); // Broadcast
    });

    it("allows valid public IPv4 addresses", () => {
      expect(isPrivateOrReservedIPv4("8.8.8.8")).toBe(false); // Google DNS
      expect(isPrivateOrReservedIPv4("1.1.1.1")).toBe(false); // Cloudflare
      expect(isPrivateOrReservedIPv4("93.184.216.34")).toBe(false); // example.com
    });
  });

  describe("2. IPv6 Private, Loopback, & IPv4-Mapped Validation", () => {
    it("blocks loopback and unspecified IPv6", () => {
      expect(isPrivateOrReservedIPv6("::1")).toBe(true);
      expect(isPrivateOrReservedIPv6("::")).toBe(true);
      expect(isPrivateOrReservedIPv6("0:0:0:0:0:0:0:1")).toBe(true);
    });

    it("blocks IPv4-mapped IPv6 pointing to private addresses", () => {
      expect(isPrivateOrReservedIPv6("::ffff:127.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv6("::ffff:169.254.169.254")).toBe(true);
      expect(isPrivateOrReservedIPv6("::ffff:10.0.0.5")).toBe(true);
      expect(isPrivateOrReservedIPv6("::ffff:192.168.1.1")).toBe(true);
      expect(isPrivateOrReservedIPv6("::ffff:8.8.8.8")).toBe(false);
    });

    it("blocks link-local and unique local IPv6", () => {
      expect(isPrivateOrReservedIPv6("fe80::1")).toBe(true);
      expect(isPrivateOrReservedIPv6("fc00::1")).toBe(true);
      expect(isPrivateOrReservedIPv6("fd12:3456:789a::1")).toBe(true);
      expect(isPrivateOrReservedIPv6("ff02::1")).toBe(true); // Multicast
    });

    it("allows public IPv6 addresses", () => {
      expect(isPrivateOrReservedIPv6("2607:f8b0:4005:805::200e")).toBe(false);
      expect(isPrivateOrReservedIPv6("2606:4700:4700::1111")).toBe(false);
    });
  });

  describe("3. URL Syntax, Port, & Scheme Enforcement", () => {
    it("rejects non-HTTP protocols (file, ftp, gopher, javascript)", () => {
      expect(isSyntacticallySafeUrl(new URL("file:///etc/passwd"))).toBe(false);
      expect(isSyntacticallySafeUrl(new URL("ftp://ftp.example.com"))).toBe(false);
      expect(isSyntacticallySafeUrl(new URL("gopher://localhost:70"))).toBe(false);
      expect(isSyntacticallySafeUrl(new URL("javascript:alert(1)"))).toBe(false);
    });

    it("rejects non-standard ports to prevent internal port scanning", () => {
      expect(isSyntacticallySafeUrl(new URL("http://example.com:22"))).toBe(false);
      expect(isSyntacticallySafeUrl(new URL("http://example.com:3306"))).toBe(false);
      expect(isSyntacticallySafeUrl(new URL("http://example.com:6379"))).toBe(false);
      expect(isSyntacticallySafeUrl(new URL("http://example.com:8080"))).toBe(false);
      expect(isSyntacticallySafeUrl(new URL("http://example.com:80"))).toBe(true);
      expect(isSyntacticallySafeUrl(new URL("https://example.com:443"))).toBe(true);
      expect(isSyntacticallySafeUrl(new URL("https://example.com"))).toBe(true);
    });

    it("rejects URLs with credentials / userinfo", () => {
      expect(isSyntacticallySafeUrl(new URL("http://user:pass@example.com"))).toBe(false);
      expect(isSyntacticallySafeUrl(new URL("http://admin@example.com"))).toBe(false);
    });

    it("rejects localhost and single-label internal hosts", () => {
      expect(isSyntacticallySafeUrl(new URL("http://localhost"))).toBe(false);
      expect(isSyntacticallySafeUrl(new URL("http://app.localhost"))).toBe(false);
      expect(isSyntacticallySafeUrl(new URL("http://router.local"))).toBe(false);
      expect(isSyntacticallySafeUrl(new URL("http://metadata.google.internal"))).toBe(false);
      expect(isSyntacticallySafeUrl(new URL("http://intranet/dashboard"))).toBe(false);
    });
  });

  describe("4. DNS Resolution & IP Pinning", () => {
    it("rejects hostnames resolving to private IP addresses", async () => {
      vi.spyOn(dns, "lookup").mockResolvedValueOnce([
        { address: "127.0.0.1", family: 4 },
      ] as any);
      const result = await resolveAndValidateHost("local-test.me");
      expect(result).toBe(false);
    });

    it("rejects hostnames if any dual-stack record resolves to private IP", async () => {
      vi.spyOn(dns, "lookup").mockResolvedValueOnce([
        { address: "93.184.216.34", family: 4 },
        { address: "::1", family: 6 },
      ] as any);
      const result = await resolveAndValidateHost("dual-stack-rebinding.com");
      expect(result).toBe(false);
    });

    it("approves hostnames resolving exclusively to public IP addresses", async () => {
      vi.spyOn(dns, "lookup").mockResolvedValueOnce([
        { address: "93.184.216.34", family: 4 },
        { address: "2606:2800:220:1:248:1893:25c8:1946", family: 6 },
      ] as any);
      const result = await resolveAndValidateHost("example.com");
      expect(result).toBe(true);
    });

    it("rejects unresolvable hostnames", async () => {
      vi.spyOn(dns, "lookup").mockRejectedValueOnce(new Error("ENOTFOUND"));
      const result = await resolveAndValidateHost("non-existent-domain-12345.xyz");
      expect(result).toBe(false);
    });
  });

  describe("5. Bounded Cache & LRU Eviction", () => {
    it("stores and retrieves metadata", () => {
      const mockData = {
        url: "https://example.com",
        domain: "example.com",
        title: "Example Domain",
      };
      setInCache("https://example.com", mockData);
      const retrieved = getFromCache("https://example.com");
      expect(retrieved).toEqual(mockData);
    });

    it("evicts expired entries on access and bounds capacity", () => {
      const now = Date.now();
      previewCache.set("https://expired.com", {
        data: { url: "https://expired.com", domain: "expired.com", title: "Expired" },
        expiresAt: now - 1000,
      });

      expect(getFromCache("https://expired.com")).toBeNull();
      expect(previewCache.has("https://expired.com")).toBe(false);
    });
  });

  describe("6. Rate Limiting", () => {
    it("allows requests within threshold and blocks with 429 when threshold exceeded", () => {
      const testIp = "198.51.100.42";
      for (let i = 0; i < 30; i++) {
        const res = checkRateLimit(testIp);
        expect(res.allowed).toBe(true);
      }

      // 31st request should be blocked
      const blocked = checkRateLimit(testIp);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    });
  });

  describe("7. End-to-End Route Handler Protections", () => {
    it("returns 400 when url parameter is missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/link-preview");
      const res = await GET(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("Missing 'url'");
    });

    it("returns 403 when destination is a direct private IP (169.254.169.254)", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/link-preview?url=http://169.254.169.254/latest/meta-data/"
      );
      const res = await GET(req);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toContain("SSRF security policy");
    });

    it("returns 403 when domain resolves to a loopback address", async () => {
      vi.spyOn(dns, "lookup").mockResolvedValueOnce([
        { address: "127.0.0.1", family: 4 },
      ] as any);
      const req = new NextRequest(
        "http://localhost:3000/api/link-preview?url=http://attacker-controlled-subdomain.com"
      );
      const res = await GET(req);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toContain("private or reserved network address");
    });

    it("validates manual redirects and blocks redirection to internal metadata", async () => {
      // Step 1: Initial host resolves to public IP
      vi.spyOn(dns, "lookup").mockResolvedValueOnce([
        { address: "93.184.216.34", family: 4 },
      ] as any);

      // Mock fetch: first call returns 302 redirecting to http://169.254.169.254
      const mockFetch = vi.fn().mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: {
            Location: "http://169.254.169.254/latest/meta-data/",
          },
        })
      );
      vi.stubGlobal("fetch", mockFetch);

      const req = new NextRequest(
        "http://localhost:3000/api/link-preview?url=https://safe-looking-redirector.com/go"
      );
      const res = await GET(req);

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toContain("Redirect target violates SSRF policy");
      // Verify fetch was NOT called a second time targeting the internal metadata service!
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("returns 429 when client IP exceeds rate limit", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/link-preview?url=https://example.com",
        { headers: { "x-forwarded-for": "203.0.113.99" } }
      );

      for (let i = 0; i < 30; i++) {
        checkRateLimit("203.0.113.99");
      }

      const res = await GET(req);
      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBeTruthy();
    });
  });
});
