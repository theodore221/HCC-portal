"use server";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database, ProfileRecord } from "@/lib/database.types";
import { BookingServiceError } from "./booking-service-error";

function pickFirstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return null;
}

interface BookingApprovalResult {
  booking: Database["public"]["Tables"]["bookings"]["Row"];
  profile: ProfileRecord;
  magicLink: string;
  userEmail: string;
  userName: string | null;
}

type ServiceSupabaseClient = SupabaseClient<Database>;

function createServiceRoleClient(): ServiceSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new BookingServiceError(
      "Supabase service role credentials are not configured for booking provisioning.",
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

function normalizeEmail(email: string | null): string {
  const normalized = pickFirstNonEmpty(email)?.toLowerCase();

  if (!normalized) {
    throw new BookingServiceError("A valid customer email address is required for approval.", {
      status: 400,
    });
  }

  return normalized;
}

function resolveProfileName(
  booking:
    | Pick<
        Database["public"]["Tables"]["bookings"]["Row"],
        "customer_name" | "contact_name" | "customer_email"
      >,
  existingProfile: ProfileRecord | null,
  userEmail: string
): string | null {
  return (
    pickFirstNonEmpty(
      booking.customer_name,
      booking.contact_name,
      existingProfile?.full_name,
      userEmail.split("@")[0]
    ) ?? null
  );
}

function resolveBookingReference(
  booking: Database["public"]["Tables"]["bookings"]["Row"],
  ...fallbacks: Array<string | null | undefined>
): string {
  return pickFirstNonEmpty(...fallbacks, booking.reference, booking.id) ?? booking.id;
}

async function ensureCustomerUser(
  supabase: ServiceSupabaseClient,
  booking: Database["public"]["Tables"]["bookings"]["Row"],
  bookingReference: string
) {
  const normalizedEmail = normalizeEmail(booking.customer_email);

  const reconcileEmailForUser = async (userId: string) => {
    const { data, error } = await supabase.auth.admin.getUserById(userId);

    if (error || !data.user) {
      return null;
    }

    const currentEmail = data.user.email ? normalizeEmail(data.user.email) : null;

    if (!currentEmail || currentEmail !== normalizedEmail) {
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        email: normalizedEmail,
        email_confirm: true,
      });

      if (updateError || !updatedUser.user) {
        throw new BookingServiceError("Unable to update the customer's account email.", {
          status: 500,
          cause: updateError,
        });
      }

      return { user: updatedUser.user, email: normalizedEmail };
    }

    return { user: data.user, email: currentEmail ?? normalizedEmail };
  };

  if (booking.customer_user_id) {
    const reconciled = await reconcileEmailForUser(booking.customer_user_id);

    if (reconciled) {
      return reconciled;
    }

    console.warn(
      "Booking %s is linked to missing auth user %s. Attempting recovery via email.",
      booking.id,
      booking.customer_user_id
    );
  }

  const { data: profileForBooking, error: profileLookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("booking_reference", bookingReference)
    .maybeSingle();

  if (profileLookupError) {
    throw new BookingServiceError("Unable to verify the customer's profile for this booking.", {
      status: 500,
      cause: profileLookupError,
    });
  }

  if (profileForBooking?.id) {
    const reconciled = await reconcileEmailForUser(profileForBooking.id);

    if (reconciled) {
      return reconciled;
    }

    const { error: orphanCleanupError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", profileForBooking.id);

    if (orphanCleanupError) {
      throw new BookingServiceError("Unable to refresh the customer's profile link for this booking.", {
        status: 500,
        cause: orphanCleanupError,
      });
    }
  }

  const { data: userList, error: lookupError } = await supabase.auth.admin.listUsers({
    email: normalizedEmail,
    perPage: 1,
  });

  if (lookupError) {
    throw new BookingServiceError("Unable to verify the customer account for this booking.", {
      status: 500,
      cause: lookupError,
    });
  }

  const existingUser = userList?.users?.[0];

  if (existingUser) {
    return { user: existingUser, email: normalizedEmail };
  }

  const fullName = pickFirstNonEmpty(booking.customer_name, booking.contact_name);

  const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
    app_metadata: {
      profile_seed: {
        role: "customer",
        booking_reference: bookingReference,
      },
    },
  });

  if (createError || !createdUser.user) {
    throw new BookingServiceError("Unable to create a customer account for this booking.", {
      status: 500,
      cause: createError,
    });
  }

  return { user: createdUser.user, email: normalizedEmail };
}

async function upsertCustomerProfile(
  supabase: ServiceSupabaseClient,
  booking: Database["public"]["Tables"]["bookings"]["Row"],
  userId: string,
  email: string,
  bookingReference: string
): Promise<ProfileRecord> {
  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (existingProfileError) {
    throw new BookingServiceError("Unable to load the customer's profile.", {
      status: 500,
      cause: existingProfileError,
    });
  }

  const fullName = resolveProfileName(booking, existingProfile ?? null, email);

  const safeBookingReference = resolveBookingReference(
    booking,
    bookingReference,
    existingProfile?.booking_reference
  );

  const payload: ProfileRecord = {
    id: userId,
    email,
    full_name: fullName,
    role: "customer",
    booking_reference: safeBookingReference,
    guest_token: existingProfile?.guest_token ?? null,
    caterer_id: existingProfile?.caterer_id ?? null,
    created_at: existingProfile?.created_at ?? new Date().toISOString(),
    password_initialized_at: existingProfile?.password_initialized_at ?? null,
  };

  const { data: upsertedProfile, error: upsertError } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (upsertError || !upsertedProfile) {
    throw new BookingServiceError("Unable to provision the customer's profile.", {
      status: 500,
      cause: upsertError,
    });
  }

  return upsertedProfile;
}

async function finalizeBookingApproval(
  supabase: ServiceSupabaseClient,
  booking: Database["public"]["Tables"]["bookings"]["Row"],
  userId: string
): Promise<Database["public"]["Tables"]["bookings"]["Row"]> {
  const updates: Partial<Database["public"]["Tables"]["bookings"]["Row"]> = {};

  if (booking.customer_user_id !== userId) {
    updates.customer_user_id = userId;
  }

  if (booking.status !== "Approved") {
    updates.status = "Approved";
  }

  if (Object.keys(updates).length === 0) {
    return { ...booking, customer_user_id: userId };
  }

  const { data, error } = await supabase
    .from("bookings")
    .update(updates)
    .eq("id", booking.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new BookingServiceError("Unable to finalize the booking approval state.", {
      status: 500,
      cause: error,
    });
  }

  return data;
}

async function generatePortalMagicLink(
  supabase: ServiceSupabaseClient,
  email: string,
  reference: string
): Promise<string> {
  const siteUrl = process.env.PUBLIC_SITE_URL;

  if (!siteUrl) {
    throw new BookingServiceError(
      "PUBLIC_SITE_URL is not configured. Unable to generate the customer login link.",
      { status: 500 }
    );
  }

  const redirectTo = new URL(`/portal/${encodeURIComponent(reference)}`, siteUrl).toString();

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo,
    },
  });

  const magicLink = data?.properties?.action_link;

  if (error || !magicLink) {
    throw new BookingServiceError("Unable to generate the customer login link.", {
      status: 500,
      cause: error,
    });
  }

  return magicLink;
}

export async function approveBookingAndInviteCustomer(
  bookingId: string
): Promise<BookingApprovalResult> {
  const supabase = createServiceRoleClient();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError) {
    throw new BookingServiceError("Unable to load the booking requested for approval.", {
      status: 500,
      cause: bookingError,
    });
  }

  if (!booking) {
    throw new BookingServiceError("The requested booking could not be found.", { status: 404 });
  }

  const bookingReference = resolveBookingReference(booking);

  const { user, email } = await ensureCustomerUser(supabase, booking, bookingReference);

  const profile = await upsertCustomerProfile(supabase, booking, user.id, email, bookingReference);

  const updatedBooking = await finalizeBookingApproval(supabase, booking, user.id);

  const magicLink = await generatePortalMagicLink(supabase, email, bookingReference);

  return {
    booking: updatedBooking,
    profile,
    magicLink,
    userEmail: email,
    userName: profile.full_name,
  };
}
