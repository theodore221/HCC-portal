// @ts-nocheck
import { cache } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

import { sbServer } from "@/lib/supabase-server";
import type { Database, ProfileRecord } from "@/lib/database.types";

export interface CurrentProfileResult {
  session: Session | null;
  profile: ProfileRecord | null;
}

async function _getCurrentProfile(
  supabaseClient?: SupabaseClient<Database>
): Promise<CurrentProfileResult> {
  const supabase = supabaseClient ?? (await sbServer());

  const [{
    data: { session },
  }, {
    data: { user },
    error: userError,
  }] = await Promise.all([
    supabase.auth.getSession(),
    supabase.auth.getUser(),
  ]);

  if (userError) {
    console.error("Failed to load user", userError);
  }

  if (!session || !user) {
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

// Wrap with React cache to deduplicate calls within a single render tree
export const getCurrentProfile = cache(_getCurrentProfile);
