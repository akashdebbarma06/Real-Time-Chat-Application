import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { GET } from "@/app/auth/callback/route";
import { createClient } from "@/lib/supabase/server";

describe("OAuth Deep Link & Mobile Auth Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects standard web OAuth callbacks directly to /chat", async () => {
    const mockExchange = vi.fn().mockResolvedValue({
      data: {
        session: { access_token: "mock-access-token", refresh_token: "mock-refresh-token" },
        user: { id: "user-123" },
      },
      error: null,
    });

    vi.mocked(createClient).mockResolvedValue({
      auth: { exchangeCodeForSession: mockExchange },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const request = new Request("https://chatsphere-tan.vercel.app/auth/callback?code=valid-code", {
      headers: { host: "chatsphere-tan.vercel.app" },
    });
    const response = await GET(request);

    expect(mockExchange).toHaveBeenCalledWith("valid-code");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://chatsphere-tan.vercel.app/chat");
  });

  it("returns the HTML mobile app bridge with deep links when source=app is specified", async () => {
    const mockExchange = vi.fn().mockResolvedValue({
      data: {
        session: { access_token: "secret-token-123", refresh_token: "refresh-token-456" },
        user: { id: "user-123" },
      },
      error: null,
    });

    vi.mocked(createClient).mockResolvedValue({
      auth: { exchangeCodeForSession: mockExchange },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const request = new Request(
      "https://chatsphere-tan.vercel.app/auth/callback?code=valid-code&source=app"
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");

    const html = await response.text();
    expect(html).toContain("aetherchat://auth-callback?access_token=secret-token-123&refresh_token=refresh-token-456");
    expect(html).toContain("intent://auth-callback?access_token=secret-token-123&refresh_token=refresh-token-456#Intent;scheme=aetherchat;package=com.aetherchat.app;end");
    expect(html).toContain("Open Aether Chat App");
  });

  it("handles missing code gracefully for mobile app source", async () => {
    const request = new Request("https://chatsphere-tan.vercel.app/auth/callback?source=app");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Sign-in Failed");
    expect(html).toContain("Authentication code missing");
    expect(html).toContain("aetherchat://auth-callback?error=");
  });

  it("handles OAuth exchange error and provides app return link", async () => {
    const mockExchange = vi.fn().mockResolvedValue({
      data: null,
      error: new Error("Invalid or expired OAuth grant"),
    });

    vi.mocked(createClient).mockResolvedValue({
      auth: { exchangeCodeForSession: mockExchange },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const request = new Request(
      "https://chatsphere-tan.vercel.app/auth/callback?code=expired-code&source=app"
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Sign-in Failed");
    expect(html).toContain("Invalid or expired OAuth grant");
    expect(html).toContain("aetherchat://auth-callback?error=Invalid%20or%20expired%20OAuth%20grant");
  });
});
