import type { Session } from "@supabase/supabase-js";

import { sbServer } from "@/lib/supabase-server";
import type { ProfileRecord } from "@/lib/database.types";

export interface CurrentProfileResult {
  session: Session | null;
  profile: ProfileRecord | null;
}

export async function getCurrentProfile(): Promise<CurrentProfileResult> {
  const supabase = sbServer();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { session: null, profile: null };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, role, booking_reference, guest_token, caterer_id, created_at, password_initialized_at"
    )
    .eq("id", session.user.id)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("Failed to load profile", error);
    return { session, profile: null };
  }

  return { session, profile: profile ?? null };
}
