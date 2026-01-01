"use server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient as SupabaseJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database } from "@/lib/database.types";
import {
  deriveProfileAttributes,
  extractProfileSeed,
  MissingBookingLinkError,
  MissingCatererLinkError,
  normalizeProfile,
  type NormalizedProfile,
  ProfileServiceError,
  UnauthorizedProfileError,
} from "./profile-domain";

type AuthenticatedSupabaseClient = ReturnType<
  typeof createSupabaseClient
> extends Promise<infer Client>
  ? Client
  : never;

type ServiceSupabaseClient = SupabaseJsClient<Database>;

interface BookingLookup {
  reference: string;
  customer_user_id: string | null;
  customer_email: string | null;
}

async function createSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Action.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

function createServiceRoleClient(): ServiceSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new ProfileServiceError(
      "Supabase service role credentials are not configured for profile provisioning.",
      { status: 500 }
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function ensureProfileForCurrentUser(): Promise<NormalizedProfile> {
  const supabase = await createSupabaseClient();
  return ensureProfileWithClient(supabase);
}

async function ensureProfileWithClient(
  supabase: AuthenticatedSupabaseClient,
  options?: { serviceSupabase?: ServiceSupabaseClient }
): Promise<NormalizedProfile> {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw new ProfileServiceError("Unable to load the authenticated user.", {
      status: 500,
      cause: userError,
    });
  }

  const user = userData.user;

  if (!user) {
    throw new UnauthorizedProfileError();
  }

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfileError) {
    throw new ProfileServiceError("Unable to load your profile.", {
      status: 500,
      cause: existingProfileError,
    });
  }

  if (existingProfile) {
    return normalizeProfile(existingProfile);
  }

  const metadata = extractProfileSeed(user);

  let booking: BookingLookup | null = null;

  const serviceSupabase = options?.serviceSupabase ?? createServiceRoleClient();

  if (metadata.booking_reference) {
    const { data: bookingLookup, error: bookingError } = await serviceSupabase
      .from("bookings")
      .select("reference, customer_user_id, customer_email")
      .eq("reference", metadata.booking_reference)
      .maybeSingle();

    if (bookingError) {
      throw new ProfileServiceError(
        "Unable to validate the booking reference provided.",
        {
          status: 500,
          cause: bookingError,
        }
      );
    }

    booking = bookingLookup;
  }

  let matchedCatererId: string | null = null;
  let fallbackCatererId: string | null = null;

  if (metadata.caterer_id) {
    const { data: catererLookup, error: catererError } = (await serviceSupabase
      .from("caterers")
      .select("id")
      .eq("id", metadata.caterer_id)
      .maybeSingle()) as { data: { id: string } | null; error: any };

    if (catererError) {
      throw new ProfileServiceError(
        "Unable to validate the caterer link provided.",
        {
          status: 500,
          cause: catererError,
        }
      );
    }

    matchedCatererId = catererLookup?.id ?? null;
  } else {
    const { data: fallbackCaterer, error: fallbackError } = (await serviceSupabase
        .from("caterers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()) as { data: { id: string } | null; error: any };

    if (fallbackError) {
      throw new ProfileServiceError(
        "Unable to determine if you are linked to a caterer.",
        {
          status: 500,
          cause: fallbackError,
        }
      );
    }

    fallbackCatererId = fallbackCaterer?.id ?? null;
  }

  const derived = deriveProfileAttributes({
    userId: user.id,
    userEmail: user.email ?? null,
    metadata,
    booking,
    matchedCatererId,
    fallbackCatererId,
  });

  const { data: insertedProfile, error: insertError } = await serviceSupabase
    .from("profiles")
    // @ts-ignore - Type compatibility issue with @supabase/ssr
    .insert({
      id: user.id,
      email: user.email ? user.email.toLowerCase() : null,
      full_name:
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : user.email
          ? user.email.split("@")[0]
          : null,
      role: derived.role,
      booking_reference: derived.bookingReference,
      guest_token: derived.guestToken,
      caterer_id: derived.catererId,
      created_at: user.created_at ?? new Date().toISOString(),
    })
    .select("*")
    .single();

  if (insertError || !insertedProfile) {
    throw new ProfileServiceError("Unable to create your profile.", {
      status: 500,
      cause: insertError,
    });
  }

  return normalizeProfile(insertedProfile);
}

export async function markPasswordInitialized(): Promise<NormalizedProfile> {
  const supabase = await createSupabaseClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw new ProfileServiceError("Unable to load the authenticated user.", {
      status: 500,
      cause: userError,
    });
  }

  const user = userData.user;

  if (!user) {
    throw new UnauthorizedProfileError();
  }

  const timestamp = new Date().toISOString();

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    // @ts-ignore - Type compatibility issue with @supabase/ssr
    .update({ password_initialized_at: timestamp })
    .eq("id", user.id)
    .select("*")
    .single();

  if (updateError) {
    if ((updateError as { code?: string }).code === "PGRST116") {
      throw new ProfileServiceError(
        "No profile exists for the authenticated user.",
        {
          status: 404,
          cause: updateError,
        }
      );
    }

    throw new ProfileServiceError("Unable to update your profile.", {
      status: 500,
      cause: updateError,
    });
  }

  if (!updatedProfile) {
    throw new ProfileServiceError(
      "No profile exists for the authenticated user.",
      {
        status: 404,
      }
    );
  }

  return normalizeProfile(updatedProfile);
}
