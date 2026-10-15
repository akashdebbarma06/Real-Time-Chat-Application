import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface SessionPayload {
  access_token: string;
  refresh_token: string;
}

interface BridgePayload {
  session?: SessionPayload | null;
  code?: string | null;
}

function escapeHtmlAttr(str: string): string {
  return str.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return c;
    }
  });
}

/**
 * Validates the `next` destination parameter strictly against the application origin.
 * Rejects protocol-relative URLs (//), external destinations, backslash bypasses (/\ or \),
 * encoded bypasses (%5c, %2f), control characters, and unexpected URL schemes.
 */
export function validateNextUrl(requestedNext: string | null | undefined, baseUrl: string): string {
  const fallback = "/chat";
  if (!requestedNext || typeof requestedNext !== "string") {
    return fallback;
  }

  // Reject raw or decoded backslashes which can trick browser navigation into external domains
  if (requestedNext.includes("\\") || requestedNext.startsWith("//")) {
    return fallback;
  }

  // Reject encoded backslash (%5c, %5C) or double slashes
  let decoded = requestedNext;
  try {
    decoded = decodeURIComponent(requestedNext);
    if (decoded.includes("\\") || decoded.startsWith("//") || /[\x00-\x1F\x7F]/.test(decoded)) {
      return fallback;
    }
  } catch {
    return fallback;
  }

  try {
    const parsedBase = new URL(baseUrl);
    // Parse using baseUrl as base
    const parsed = new URL(requestedNext, baseUrl);

    // Reject if origin does not match trusted application origin
    if (parsed.origin !== parsedBase.origin) {
      return fallback;
    }

    // Must be standard HTTP/HTTPS
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return fallback;
    }

    // Path must start with exactly one '/' and not '//'
    if (!parsed.pathname.startsWith("/") || parsed.pathname.startsWith("//")) {
      return fallback;
    }

    // Return the safe same-origin pathname, search, and hash
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * Resolves the canonical, trusted base URL of the application.
 * Never blindly trusts arbitrary external x-forwarded-host headers.
 */
export function getTrustedBaseUrl(request: Request): string {
  // 1. Configured canonical origin from environment is the primary authority
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) {
    try {
      const parsed = new URL(envUrl);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.origin;
      }
    } catch {
      // Fall through if misconfigured
    }
  }

  // 2. Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. Fallback derived safely from request.url
  try {
    const reqUrl = new URL(request.url);
    const host = reqUrl.host.toLowerCase();

    // Verify host against safe known hosts
    const isLocal =
      host === "localhost" ||
      host.startsWith("localhost:") ||
      host === "127.0.0.1" ||
      host.startsWith("127.0.0.1:");
    const isVercel = host.endsWith(".vercel.app");

    if (isLocal || isVercel) {
      return reqUrl.origin;
    }

    // Check forwarded host only if it matches safe local or vercel domains
    const fHost = request.headers.get("x-forwarded-host")?.toLowerCase();
    const fProto = request.headers.get("x-forwarded-proto") || "https";
    if (
      fHost &&
      (fHost === "localhost" ||
        fHost.startsWith("localhost:") ||
        fHost === "127.0.0.1" ||
        fHost.startsWith("127.0.0.1:") ||
        fHost.endsWith(".vercel.app"))
    ) {
      return `${fProto}://${fHost}`;
    }

    return reqUrl.origin;
  } catch {
    return "http://localhost:3000";
  }
}

function renderMobileBridge(
  payload: BridgePayload | null,
  errorMsg: string | null,
  next: string = "/chat"
) {
  const safeNext = escapeHtmlAttr(next);

  if (errorMsg || (!payload?.session && !payload?.code)) {
    const errorParam = encodeURIComponent(errorMsg || "Authentication failed");
    const appErrorScheme = `aetherchat://auth-callback?error=${errorParam}`;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Aether Chat — Sign-in Failed</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 1.5rem; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background-color: #09090b; color: #fafafa; font-family: system-ui, -apple-system, sans-serif;
    }
    .card {
      max-width: 400px; width: 100%; background-color: #18181b; border: 1px solid #27272a;
      border-radius: 1.25rem; padding: 2.25rem 1.75rem; text-align: center;
    }
    h2 { margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 700; color: #ef4444; }
    p { color: #a1a1aa; font-size: 0.9rem; line-height: 1.5; margin: 0 0 1.5rem; }
    .btn {
      display: inline-block; width: 100%; padding: 0.85rem 1.25rem; background: #8b5cf6;
      color: #ffffff; text-decoration: none; border-radius: 0.75rem; font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2>Sign-in Failed</h2>
    <p>${escapeHtmlAttr(errorMsg || "Unable to complete authentication.")}</p>
    <a href="${escapeHtmlAttr(appErrorScheme)}" class="btn">Return to Aether Chat</a>
  </div>
</body>
</html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  let queryParams = "";
  if (payload.code) {
    queryParams = `code=${encodeURIComponent(payload.code)}`;
  } else if (payload.session) {
    const accessToken = encodeURIComponent(payload.session.access_token);
    const refreshToken = encodeURIComponent(payload.session.refresh_token);
    queryParams = `access_token=${accessToken}&refresh_token=${refreshToken}`;
  }

  const appScheme = `aetherchat://auth-callback?${queryParams}`;
  const appPkgScheme = `com.aetherchat.app://auth-callback?${queryParams}`;
  const chromeIntent = `intent://auth-callback?${queryParams}#Intent;scheme=aetherchat;package=com.aetherchat.app;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Returning to Aether Chat...</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 1.5rem; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background-color: #09090b; color: #fafafa; font-family: system-ui, -apple-system, sans-serif;
    }
    .card {
      max-width: 420px; width: 100%; background-color: #18181b; border: 1px solid #27272a;
      border-radius: 1.25rem; padding: 2.5rem 2rem; text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .logo {
      width: 56px; height: 56px; margin: 0 auto 1.25rem;
      background: linear-gradient(135deg, #8b5cf6, #3b82f6);
      border-radius: 1rem; display: flex; align-items: center; justify-content: center;
      font-size: 1.75rem; font-weight: bold; color: white;
    }
    .spinner {
      width: 32px; height: 32px; border: 3px solid #27272a; border-top-color: #8b5cf6;
      border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.25rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 700; }
    p { color: #a1a1aa; font-size: 0.9rem; line-height: 1.5; margin: 0 0 1.5rem; }
    .btn {
      display: inline-block; width: 100%; padding: 0.875rem 1.5rem; background: #8b5cf6;
      color: #ffffff; text-decoration: none; border-radius: 0.75rem; font-weight: 600; font-size: 0.95rem;
      transition: background-color 0.2s; cursor: pointer;
    }
    .btn:hover { background: #7c3aed; }
    .secondary-link {
      display: inline-block; margin-top: 1rem; color: #71717a; font-size: 0.825rem; text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">⚡</div>
    <div class="spinner"></div>
    <h2>Authentication Complete</h2>
    <p>Returning to your Aether Chat application...</p>
    <a id="launch-btn" href="${escapeHtmlAttr(chromeIntent)}" class="btn">Open Aether Chat App</a>
    <div>
      <a href="${safeNext}" class="secondary-link">Continue in browser instead</a>
    </div>
  </div>
  <script>
    const deepLink = "${escapeHtmlAttr(appScheme)}";
    const chromeIntent = "${escapeHtmlAttr(chromeIntent)}";
    const pkgLink = "${escapeHtmlAttr(appPkgScheme)}";

    function launchApp() {
      try {
        if (/android/i.test(navigator.userAgent)) {
          window.location.href = chromeIntent;
        } else {
          window.location.href = deepLink;
        }
      } catch (e) {
        window.location.href = deepLink;
      }
    }

    launchApp();

    setTimeout(function() {
      window.location.href = deepLink;
    }, 500);

    setTimeout(function() {
      window.location.href = pkgLink;
    }, 1200);

    const btn = document.getElementById("launch-btn");
    if (btn) {
      btn.addEventListener("click", function(e) {
        if (/android/i.test(navigator.userAgent)) {
          window.location.href = chromeIntent;
        } else {
          window.location.href = deepLink;
        }
      });
    }
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  const source = url.searchParams.get("source");

  const baseUrl = getTrustedBaseUrl(request);
  const next = validateNextUrl(requestedNext, baseUrl);

  if (!code) {
    if (source === "app") {
      return renderMobileBridge(null, "Authentication code missing");
    }
    return NextResponse.redirect(new URL("/login?error=missing_code", baseUrl));
  }

  // If request originated from mobile app, do not exchange code on the server.
  // The PKCE code verifier is stored in the mobile client's WebView storage,
  // so exchanging it on the server triggers "PKCE code verifier not found in storage".
  // Bridge the authorization code directly to the native app for client-side exchange.
  if (source === "app") {
    return renderMobileBridge({ code }, null, next);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("OAuth callback session exchange failed", error);
      return NextResponse.redirect(new URL("/login?error=callback", baseUrl));
    }

    return NextResponse.redirect(new URL(next, baseUrl));
  } catch (error) {
    console.error("Unhandled exception in OAuth callback", error);
    return NextResponse.redirect(new URL("/login?error=callback", baseUrl));
  }
}
