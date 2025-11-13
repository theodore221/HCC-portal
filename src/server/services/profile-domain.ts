import type { User } from "@supabase/supabase-js";

import type { ProfileRecord, ProfileRole } from "@/lib/database.types";

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

function parseStringCandidate(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export interface ProfileSeed {
  role: string | null;
  booking_reference: string | null;
  guest_token: string | null;
  caterer_id: string | null;
}

export interface ProfileDerivationContext {
  userId: string;
  userEmail: string | null;
  metadata: ProfileSeed;
  booking: {
    reference: string;
    customer_user_id: string | null;
    customer_email: string | null;
  } | null;
  matchedCatererId: string | null;
  fallbackCatererId: string | null;
}

export interface DerivedProfileAttributes {
  role: ProfileRole;
  bookingReference: string | null;
  guestToken: string | null;
  catererId: string | null;
}

export function extractProfileSeed(user: User): ProfileSeed {
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

export function deriveProfileAttributes(
  context: ProfileDerivationContext
): DerivedProfileAttributes {
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

export function normalizeProfile(profile: ProfileRecord): NormalizedProfile {
  return {
    ...profile,
    email: profile.email ? profile.email.toLowerCase() : null,
  };
}
