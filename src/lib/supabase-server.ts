// @ts-nocheck
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

import type { Database } from "@/lib/database.types";

export async function sbServer() {
  const cookieStore = await cookies();

  return createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
}
