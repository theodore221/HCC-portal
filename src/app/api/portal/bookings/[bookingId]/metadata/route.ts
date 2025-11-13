import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/lib/database.types";

const payloadSchema = z.object({
  metadata: z.record(z.any()),
  merge: z.boolean().optional().default(true),
});

export async function PATCH(
  request: NextRequest,
  context: { params: { bookingId: string } },
) {
  const bookingId = context.params.bookingId;
  if (!bookingId) {
    return NextResponse.json(
      { message: "Missing booking identifier" },
      { status: 400 },
    );
  }

  let payload: z.infer<typeof payloadSchema>;
  try {
    const body = await request.json();
    payload = payloadSchema.parse(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid payload";
    return NextResponse.json({ message }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("portal_metadata")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError) {
    return NextResponse.json(
      { message: `Failed to load booking metadata: ${bookingError.message}` },
      { status: 500 },
    );
  }

  if (!booking) {
    return NextResponse.json(
      { message: "Booking not found" },
      { status: 404 },
    );
  }

  const existing = (booking.portal_metadata ?? {}) as Record<string, unknown>;
  const nextMetadata = payload.merge
    ? { ...existing, ...payload.metadata }
    : payload.metadata;

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ portal_metadata: nextMetadata })
    .eq("id", bookingId);

  if (updateError) {
    return NextResponse.json(
      { message: `Failed to save booking metadata: ${updateError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ metadata: nextMetadata });
}
