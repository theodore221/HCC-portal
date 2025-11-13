"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database, ProfileRecord, ProfileRole } from "@/lib/database.types";

type SupabaseClient = ReturnType<typeof createSupabaseClient> extends Promise<infer Client>
  ? Client
  : never;

export type NormalizedProfile = ProfileRecord;

export class ProfileServiceError extends Error {
  public readonly status: number;

  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "ProfileServiceError";
    this.status = options?.status ?? 500;
  }
}

export class UnauthorizedProfileError extends ProfileServiceError {
  constructor(message = "You must be signed in to access your profile.") {
    super(message, { status: 401 });
    this.name = "UnauthorizedProfileError";
  }
}

export class MissingBookingLinkError extends ProfileServiceError {
  constructor(message = "The booking reference provided is not associated with your account.") {
    super(message, { status: 400 });
    this.name = "MissingBookingLinkError";
  }
}

export class MissingCatererLinkError extends ProfileServiceError {
  constructor(message = "The caterer requested for this profile could not be found.") {
    super(message, { status: 400 });
    this.name = "MissingCatererLinkError";
  }
}

interface BookingLookup {
  reference: string;
  customer_user_id: string | null;
  customer_email: string | null;
}

interface ProfileSeed {
  role: string | null;
  booking_reference: string | null;
  guest_token: string | null;
  caterer_id: string | null;
}

interface DerivationContext {
  userId: string;
  userEmail: string | null;
  metadata: ProfileSeed;
  booking: BookingLookup | null;
  matchedCatererId: string | null;
  fallbackCatererId: string | null;
}

interface DerivedProfileAttributes {
  role: ProfileRole;
  bookingReference: string | null;
  guestToken: string | null;
  catererId: string | null;
}

function parseStringCandidate(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractProfileSeed(user: User): ProfileSeed {
  const rootMeta =
    (user.app_metadata?.profile_seed as Record<string, unknown> | undefined) ??
    (user.app_metadata as Record<string, unknown> | undefined) ??
    {};

  return {
    role: parseStringCandidate(rootMeta.role),
    booking_reference: parseStringCandidate(rootMeta.booking_reference),
    guest_token: parseStringCandidate(rootMeta.guest_token),
    caterer_id: parseStringCandidate(rootMeta.caterer_id),
  };
}

export function resolveRoleFromMetadata(
  requestedRole: string | null,
  hasCatererLink: boolean
): ProfileRole {
  const normalized = requestedRole?.toLowerCase() ?? "";

  let role: ProfileRole;

  switch (normalized) {
    case "admin":
      role = "admin";
      break;
    case "staff":
      role = "staff";
      break;
    case "caterer":
      role = hasCatererLink ? "caterer" : "customer";
      break;
    default:
      role = "customer";
      break;
  }

  if (hasCatererLink && role !== "admin" && role !== "staff") {
    return "caterer";
  }

  return role;
}

export function deriveProfileAttributes(context: DerivationContext): DerivedProfileAttributes {
  const { userId, userEmail, metadata, booking, matchedCatererId, fallbackCatererId } = context;

  const candidateBookingReference = metadata.booking_reference;
  let bookingReference: string | null = null;

  if (candidateBookingReference) {
    if (!booking || booking.reference !== candidateBookingReference) {
      throw new MissingBookingLinkError();
    }

    const normalizedUserEmail = userEmail?.toLowerCase() ?? null;
    const normalizedBookingEmail = booking.customer_email?.toLowerCase() ?? null;

    const isLinkedToUser =
      booking.customer_user_id === userId ||
      (!!normalizedUserEmail && !booking.customer_user_id && normalizedBookingEmail === normalizedUserEmail);

    if (!isLinkedToUser) {
      throw new MissingBookingLinkError();
    }

    bookingReference = booking.reference;
  }

  const guestToken = metadata.guest_token;

  const candidateCatererId = metadata.caterer_id;
  let catererId: string | null = null;

  if (candidateCatererId) {
    if (!matchedCatererId || matchedCatererId !== candidateCatererId) {
      throw new MissingCatererLinkError();
    }

    catererId = matchedCatererId;
  } else if (fallbackCatererId) {
    catererId = fallbackCatererId;
  }

  const role = resolveRoleFromMetadata(metadata.role, catererId !== null);

  return {
    role,
    bookingReference,
    guestToken,
    catererId,
  };
}

function normalizeProfile(profile: ProfileRecord): NormalizedProfile {
  return {
    ...profile,
    email: profile.email ? profile.email.toLowerCase() : null,
  };
}

async function createSupabaseClient() {
  const cookieStore = await cookies();
  return createServerActionClient<Database>({
    cookies: () => cookieStore,
  });
}

export async function ensureProfileForCurrentUser(): Promise<NormalizedProfile> {
  const supabase = await createSupabaseClient();
  return ensureProfileWithClient(supabase);
}

async function ensureProfileWithClient(supabase: SupabaseClient): Promise<NormalizedProfile> {
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

  if (metadata.booking_reference) {
    const { data: bookingLookup, error: bookingError } = await supabase
      .from("bookings")
      .select("reference, customer_user_id, customer_email")
      .eq("reference", metadata.booking_reference)
      .maybeSingle();

    if (bookingError) {
      throw new ProfileServiceError("Unable to validate the booking reference provided.", {
        status: 500,
        cause: bookingError,
      });
    }

    booking = bookingLookup;
  }

  let matchedCatererId: string | null = null;
  let fallbackCatererId: string | null = null;

  if (metadata.caterer_id) {
    const { data: catererLookup, error: catererError } = await supabase
      .from("caterers")
      .select("id")
      .eq("id", metadata.caterer_id)
      .maybeSingle();

    if (catererError) {
      throw new ProfileServiceError("Unable to validate the caterer link provided.", {
        status: 500,
        cause: catererError,
      });
    }

    matchedCatererId = catererLookup?.id ?? null;
  } else {
    const { data: fallbackCaterer, error: fallbackError } = await supabase
      .from("caterers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (fallbackError) {
      throw new ProfileServiceError("Unable to determine if you are linked to a caterer.", {
        status: 500,
        cause: fallbackError,
      });
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

  const { data: insertedProfile, error: insertError } = await supabase
    .from("profiles")
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
    .update({ password_initialized_at: timestamp })
    .eq("id", user.id)
    .select("*")
    .single();

  if (updateError) {
    if ((updateError as { code?: string }).code === "PGRST116") {
      throw new ProfileServiceError("No profile exists for the authenticated user.", {
        status: 404,
        cause: updateError,
      });
    }

    throw new ProfileServiceError("Unable to update your profile.", {
      status: 500,
      cause: updateError,
    });
  }

  if (!updatedProfile) {
    throw new ProfileServiceError("No profile exists for the authenticated user.", {
      status: 404,
    });
  }

  return normalizeProfile(updatedProfile);
}

// Exported for unit testing.
export const __test = {
  parseStringCandidate,
  extractProfileSeed,
  ensureProfileWithClient,
};

