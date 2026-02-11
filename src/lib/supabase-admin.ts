import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Singleton instance - created once and reused since it doesn't depend on cookies
let adminClientInstance: ReturnType<typeof createClient<Database>> | null = null;

export const sbAdmin = () => {
  if (adminClientInstance) {
    return adminClientInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase URL or Service Role Key");
  }

  adminClientInstance = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClientInstance;
};
