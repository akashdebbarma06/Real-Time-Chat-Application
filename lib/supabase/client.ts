import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getPublicSupabaseKey, getPublicSupabaseUrl } from "@/lib/supabase/config";

let client: SupabaseClient<Database> | undefined;

export function createClient() {
  if (client) return client;

  client = createBrowserClient<Database>(
    getPublicSupabaseUrl(),
    getPublicSupabaseKey(),
  );

  return client;
}
