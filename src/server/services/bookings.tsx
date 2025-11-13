"use server";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";

import type { Database, Tables } from "@/lib/database.types";
import { BookingConfirmationEmail } from "@/server/emails/booking-confirmation";

export class BookingServiceError extends Error {
  public readonly status: number;

  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message, options);
    this.name = "BookingServiceError";
    this.status = options?.status ?? 500;
  }
}

type BookingRecord = Tables<"bookings">;

type ApproveBookingOptions = {
  bookingId: string;
};

type ApproveBookingResult = {
  booking: BookingRecord;
  magicLinkUrl: string;
};

let cachedServiceClient: SupabaseClient<Database> | null = null;
let cachedResendClient: Resend | null = null;

function getSupabaseServiceClient(): SupabaseClient<Database> {
  if (cachedServiceClient) {
    return cachedServiceClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new BookingServiceError(
      "Supabase service role credentials are not configured for booking approvals.",
      { status: 500 }
    );
  }

  cachedServiceClient = createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedServiceClient;
}

function getResendClient() {
  if (cachedResendClient) {
    return cachedResendClient;
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new BookingServiceError(
      "Resend is not configured. Set RESEND_API_KEY to send confirmation emails.",
      { status: 500 }
    );
  }

  cachedResendClient = new Resend(apiKey);
  return cachedResendClient;
}

function getSiteUrl() {
  const siteUrl = process.env.PUBLIC_SITE_URL;

  if (!siteUrl) {
    throw new BookingServiceError(
      "PUBLIC_SITE_URL is not configured. Set it to the base URL of the portal.",
      { status: 500 }
    );
  }

  return siteUrl.replace(/\/$/, "");
}

async function ensureCustomerAuthUser(
  supabase: SupabaseClient<Database>,
  booking: BookingRecord
) {
  const email = booking.customer_email;

  if (!email) {
    throw new BookingServiceError(
      "The booking does not have a customer email address to provision an account.",
      { status: 400 }
    );
  }

  if (booking.customer_user_id) {
    return booking.customer_user_id;
  }

  const { data: existingUser, error: existingUserError } = await supabase.auth.admin.getUserByEmail(
    email
  );

  if (existingUserError && existingUserError.message !== "User not found") {
    throw new BookingServiceError("Unable to check for an existing Supabase user.", {
      status: 500,
      cause: existingUserError,
    });
  }

  if (existingUser?.user) {
    return existingUser.user.id;
  }

  const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: booking.customer_name,
      booking_reference: booking.reference,
    },
  });

  if (createUserError || !createdUser?.user?.id) {
    throw new BookingServiceError("Unable to create a Supabase user for the booking contact.", {
      status: 500,
      cause: createUserError,
    });
  }

  return createdUser.user.id;
}

async function ensureCustomerProfile(
  supabase: SupabaseClient<Database>,
  params: {
    userId: string;
    email: string;
    name: string | null;
    bookingReference: string | null;
  }
) {
  const normalizedEmail = params.email.toLowerCase();

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", params.userId)
    .maybeSingle();

  if (existingProfileError) {
    throw new BookingServiceError("Unable to look up the customer's profile.", {
      status: 500,
      cause: existingProfileError,
    });
  }

  if (!existingProfile) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: params.userId,
      email: normalizedEmail,
      full_name: params.name,
      role: "customer",
      booking_reference: params.bookingReference,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      throw new BookingServiceError("Unable to create a customer profile for the booking.", {
        status: 500,
        cause: insertError,
      });
    }

    return;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      email: normalizedEmail,
      full_name: params.name,
      booking_reference: params.bookingReference,
      role: "customer",
    })
    .eq("id", params.userId);

  if (updateError) {
    throw new BookingServiceError("Unable to update the customer's profile.", {
      status: 500,
      cause: updateError,
    });
  }
}

export async function approveBooking(options: ApproveBookingOptions): Promise<ApproveBookingResult> {
  if (!options.bookingId) {
    throw new BookingServiceError("A booking identifier is required to approve a booking.", {
      status: 400,
    });
  }

  const supabase = getSupabaseServiceClient();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", options.bookingId)
    .maybeSingle();

  if (bookingError) {
    throw new BookingServiceError("Unable to load the booking that should be approved.", {
      status: 500,
      cause: bookingError,
    });
  }

  if (!booking) {
    throw new BookingServiceError("The requested booking could not be found.", {
      status: 404,
    });
  }

  const userId = await ensureCustomerAuthUser(supabase, booking);

  await ensureCustomerProfile(supabase, {
    userId,
    email: booking.customer_email,
    name: booking.customer_name,
    bookingReference: booking.reference,
  });

  const reference = booking.reference ?? booking.id;

  const { data: updatedBooking, error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "DepositPending",
      deposit_status: "Pending",
      deposit_received_at: null,
      deposit_reference: null,
      customer_user_id: userId,
    })
    .eq("id", booking.id)
    .select("*")
    .single();

  if (updateError || !updatedBooking) {
    throw new BookingServiceError("Unable to update the booking status during approval.", {
      status: 500,
      cause: updateError,
    });
  }

  const siteUrl = getSiteUrl();

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: booking.customer_email,
    options: {
      redirectTo: `${siteUrl}/portal/${reference}`,
    },
  });

  if (linkError || !linkData?.properties?.action_link) {
    throw new BookingServiceError("Unable to generate a portal link for the customer.", {
      status: 500,
      cause: linkError,
    });
  }

  const magicLinkUrl = linkData.properties.action_link;

  const resend = getResendClient();

  const { error: emailError } = await resend.emails.send({
    from: "Holy Cross Centre <bookings@hcc.org.au>",
    to: booking.customer_email,
    subject: `Your booking at Holy Cross Centre (${reference})`,
    react: (
      <BookingConfirmationEmail
        magicLinkUrl={magicLinkUrl}
        reference={reference}
        arrivalDate={booking.arrival_date}
        departureDate={booking.departure_date}
        customerName={booking.customer_name}
      />
    ),
  });

  if (emailError) {
    throw new BookingServiceError("Unable to send the booking confirmation email.", {
      status: 500,
      cause: emailError,
    });
  }

  return {
    booking: updatedBooking,
    magicLinkUrl,
  };
}
