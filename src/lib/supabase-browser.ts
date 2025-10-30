import { createBrowserClient } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/lib/database.types";

const browserClient = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function sbBrowser() {
  return browserClient;
}
