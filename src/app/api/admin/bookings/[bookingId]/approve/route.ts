import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/lib/database.types";
import { approveBooking, BookingServiceError } from "@/server/services/bookings";

function handleApprovalError(error: unknown) {
  if (error instanceof BookingServiceError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error("Unhandled booking approval error", error);
  return NextResponse.json(
    { error: "We couldn't approve the booking. Please try again." },
    { status: 500 }
  );
}

export async function POST(
  _request: Request,
  context: { params: { bookingId: string } }
) {
  const bookingId = context.params?.bookingId;

  if (!bookingId) {
    return NextResponse.json(
      { error: "A booking identifier is required." },
      { status: 400 }
    );
  }

  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Unable to load session for booking approval", sessionError);
    return NextResponse.json(
      { error: "We couldn't verify your session. Please try again." },
      { status: 500 }
    );
  }

  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed in to approve bookings." },
      { status: 401 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Unable to load admin profile for booking approval", profileError);
    return NextResponse.json(
      { error: "We couldn't verify your permissions. Please try again." },
      { status: 500 }
    );
  }

  if (profile?.role !== "admin") {
    return NextResponse.json(
      { error: "Only admin users can approve bookings." },
      { status: 403 }
    );
  }

  try {
    const result = await approveBooking({ bookingId });
    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApprovalError(error);
  }
}
