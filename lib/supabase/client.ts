import { createClient as createSupabaseClient } from "@supabase/supabase-js";

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
