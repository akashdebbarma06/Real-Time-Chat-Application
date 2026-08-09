import type { SupabaseClient, PostgrestResponse } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { logServerError } from "@/lib/logger";
import { createClient } from "@/lib/supabase/client";

export type SupabaseResult<T> = {
  data: T | T[] | null;
  error: Error | null;
};

export async function executeSupabase<T>(callback: (client: SupabaseClient<Database>) => Promise<PostgrestResponse<T>>): Promise<SupabaseResult<T>> {
  try {
    const supabase = createClient();
    const response = await callback(supabase);

    if (response.error) {
      logServerError(response.error, "Supabase client operation failed");
      return { data: response.data as T | T[] | null, error: response.error };
    }

    return { data: response.data as T | T[] | null, error: null };
  } catch (error) {
    logServerError(error, "Supabase client wrapper exception");
    return { data: null, error: error instanceof Error ? error : new Error("Unknown Supabase error") };
  }
}
