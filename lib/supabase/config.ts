const PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const PUBLIC_SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  "";

function parseUrl(value: string, name: string): string {
  try {
    const url = new URL(value);
    return url.toString().replace(/\/+$/, "");
  } catch {
    throw new Error(`Invalid URL provided for ${name}: ${value}`);
  }
}

export function getPublicSupabaseUrl(): string {
  if (!PUBLIC_SUPABASE_URL) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  return parseUrl(PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
}

export function getPublicSupabaseKey(): string {
  if (!PUBLIC_SUPABASE_KEY) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  return PUBLIC_SUPABASE_KEY;
}

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return parseUrl(raw, "NEXT_PUBLIC_SITE_URL");
}
