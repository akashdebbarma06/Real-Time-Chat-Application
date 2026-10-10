import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface SessionPayload {
  access_token: string;
  refresh_token: string;
}

function renderMobileBridge(
  session: SessionPayload | null,
  errorMsg: string | null,
  next: string = "/chat"
) {
  if (errorMsg || !session) {
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
    <p>${errorMsg || "Unable to complete authentication."}</p>
    <a href="${appErrorScheme}" class="btn">Return to Aether Chat</a>
  </div>
</body>
</html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  const accessToken = encodeURIComponent(session.access_token);
  const refreshToken = encodeURIComponent(session.refresh_token);
  const appScheme = `aetherchat://auth-callback?access_token=${accessToken}&refresh_token=${refreshToken}`;
  const appPkgScheme = `com.aetherchat.app://auth-callback?access_token=${accessToken}&refresh_token=${refreshToken}`;
  const chromeIntent = `intent://auth-callback?access_token=${accessToken}&refresh_token=${refreshToken}#Intent;scheme=aetherchat;package=com.aetherchat.app;end`;

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
      transition: background-color 0.2s;
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
    <a id="launch-btn" href="${chromeIntent}" class="btn">Open Aether Chat App</a>
    <div>
      <a href="${next}" class="secondary-link">Continue in browser instead</a>
    </div>
  </div>
  <script>
    const deepLink = "${appScheme}";
    const chromeIntent = "${chromeIntent}";
    const pkgLink = "${appPkgScheme}";

    function launchApp() {
      if (/android/i.test(navigator.userAgent)) {
        window.location.href = chromeIntent;
      } else {
        window.location.href = deepLink;
      }
    }

    // Attempt immediate launch
    launchApp();

    // Fallback retries
    setTimeout(function() {
      window.location.href = deepLink;
    }, 600);
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
  const next = requestedNext?.startsWith("/") ? requestedNext : "/chat";

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const baseUrl = host && !host.includes("localhost") ? `${proto}://${host}` : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!code) {
    if (source === "app") {
      return renderMobileBridge(null, "Authentication code missing");
    }
    return NextResponse.redirect(new URL("/login?error=missing_code", baseUrl));
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("OAuth callback session exchange failed", error);
      if (source === "app") {
        return renderMobileBridge(null, error.message);
      }
      return NextResponse.redirect(new URL("/login?error=callback", baseUrl));
    }

    if (source === "app" && data?.session) {
      return renderMobileBridge(data.session, null, next);
    }

    return NextResponse.redirect(new URL(next, baseUrl));
  } catch (error) {
    console.error("Unhandled exception in OAuth callback", error);
    if (source === "app") {
      return renderMobileBridge(null, "Internal authentication error");
    }
    return NextResponse.redirect(new URL("/login?error=callback", baseUrl));
  }
}
