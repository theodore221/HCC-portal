import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/lib/database.types";
import { dietaryProfileSchema } from "../schema";

const updateSchema = dietaryProfileSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

export async function PATCH(
  request: NextRequest,
  context: { params: { bookingId: string; profileId: string } },
) {
  const { bookingId, profileId } = context.params;

  if (!bookingId || !profileId) {
    return NextResponse.json(
      { message: "Missing booking or profile identifier" },
      { status: 400 },
    );
  }

  let payload: ReturnType<typeof updateSchema.parse>;
  try {
    const body = await request.json();
    payload = updateSchema.parse(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid payload";
    return NextResponse.json({ message }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  const { data, error: updateError } = await supabase
    .from("dietary_profiles")
    .update(payload)
    .eq("id", profileId)
    .eq("booking_id", bookingId)
    .select("*")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json(
      { message: `Failed to update dietary profile: ${updateError.message}` },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { message: "Dietary profile not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ profile: data });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: { bookingId: string; profileId: string } },
) {
  const { bookingId, profileId } = context.params;

  if (!bookingId || !profileId) {
    return NextResponse.json(
      { message: "Missing booking or profile identifier" },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  const { error: deleteError } = await supabase
    .from("dietary_profiles")
    .delete()
    .eq("id", profileId)
    .eq("booking_id", bookingId);

  if (deleteError) {
    return NextResponse.json(
      { message: `Failed to delete dietary profile: ${deleteError.message}` },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
