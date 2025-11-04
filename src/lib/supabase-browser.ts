import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/lib/database.types";

const browserClient = createClientComponentClient<Database>();

export function sbBrowser() {
  return browserClient;
}
