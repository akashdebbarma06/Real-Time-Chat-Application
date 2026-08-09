import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { getPublicSupabaseKey, getPublicSupabaseUrl } from "@/lib/supabase/config";
import { logServerError } from "@/lib/logger";

export async function createClient() {
  const cookieStore = await cookies();

  try {
    return createServerClient<Database>(
      getPublicSupabaseUrl(),
      getPublicSupabaseKey(),
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
            } catch (error) {
              logServerError(error, "Failed to set cookies in server Supabase client");
            }
          },
        },
      },
    );
  } catch (error) {
    logServerError(error, "Failed to create Supabase server client");
    throw error;
  }
}
