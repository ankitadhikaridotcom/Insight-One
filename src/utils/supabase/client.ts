import { supabase } from "@/lib/supabaseClient";
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    "https://wuzjvcosmzxzmskrqfap.supabase.co";

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    "sb_publishable_vIike6YtaK5fHV0RgKAuEw_AcFHigol";

  return createBrowserClient(supabaseUrl, supabaseKey);
}

export { supabase };