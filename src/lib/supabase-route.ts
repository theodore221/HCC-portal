import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export async function sbRoute(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  return createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });
}
