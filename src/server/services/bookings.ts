"use server";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database, ProfileRecord } from "@/lib/database.types";

export class BookingServiceError extends Error {
  public readonly status: number;

  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "BookingServiceError";
    this.status = options?.status ?? 500;
  }
}

export interface BookingApprovalResult {
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
  if (!email) {
    throw new BookingServiceError("A valid customer email address is required for approval.", {
      status: 400,
    });
  }

  return email.trim().toLowerCase();
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
    booking.customer_name?.trim() ||
    booking.contact_name?.trim() ||
    existingProfile?.full_name?.trim() ||
    userEmail.split("@")[0] ||
    null
  );
}

async function ensureCustomerUser(
  supabase: ServiceSupabaseClient,
  booking: Database["public"]["Tables"]["bookings"]["Row"]
) {
  const normalizedEmail = normalizeEmail(booking.customer_email);

  if (booking.customer_user_id) {
    const { data, error } = await supabase.auth.admin.getUserById(booking.customer_user_id);

    if (!error && data.user) {
      const currentEmail = data.user.email ? normalizeEmail(data.user.email) : null;

      if (currentEmail && currentEmail !== normalizedEmail) {
        const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
          booking.customer_user_id,
          {
            email: normalizedEmail,
            email_confirm: true,
          }
        );

        if (updateError || !updatedUser.user) {
          throw new BookingServiceError("Unable to update the customer's account email.", {
            status: 500,
            cause: updateError,
          });
        }

        return { user: updatedUser.user, email: normalizedEmail };
      }

      return { user: data.user, email: currentEmail ?? normalizedEmail };
    }

    console.warn(
      "Booking %s is linked to missing auth user %s. Attempting recovery via email.",
      booking.id,
      booking.customer_user_id
    );
  }

  const { data: userByEmail, error: lookupError } = await supabase.auth.admin.getUserByEmail(normalizedEmail);
  if (lookupError) {
    throw new BookingServiceError("Unable to verify the customer account for this booking.", {
      status: 500,
      cause: lookupError,
    });
  }

  if (userByEmail.user) {
    return { user: userByEmail.user, email: normalizedEmail };
  }

  const fullName = booking.customer_name?.trim() || booking.contact_name?.trim() || null;

  const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
    app_metadata: {
      profile_seed: {
        role: "customer",
        booking_reference: booking.reference,
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
  email: string
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

  const payload: ProfileRecord = {
    id: userId,
    email,
    full_name: fullName,
    role: "customer",
    booking_reference: booking.reference,
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

  if (!booking.reference) {
    throw new BookingServiceError("This booking does not have a reference assigned yet.", {
      status: 400,
    });
  }

  const { user, email } = await ensureCustomerUser(supabase, booking);

  const profile = await upsertCustomerProfile(supabase, booking, user.id, email);

  const updatedBooking = await finalizeBookingApproval(supabase, booking, user.id);

  const magicLink = await generatePortalMagicLink(supabase, email, booking.reference);

  return {
    booking: updatedBooking,
    profile,
    magicLink,
    userEmail: email,
    userName: profile.full_name,
  };
}
