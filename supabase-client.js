import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config.js";

export const supabase = isSupabaseConfigured
    ? (await import("https://esm.sh/@supabase/supabase-js@2")).createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

export { isSupabaseConfigured };
