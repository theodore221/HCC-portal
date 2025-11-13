import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/lib/database.types";
import { dietaryProfileSchema } from "./schema";

export async function POST(
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

  let payload: ReturnType<typeof dietaryProfileSchema.parse>;
  try {
    const body = await request.json();
    payload = dietaryProfileSchema.parse(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid payload";
    return NextResponse.json({ message }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  const { data, error: insertError } = await supabase
    .from("dietary_profiles")
    .insert({
      booking_id: bookingId,
      ...payload,
    })
    .select("*")
    .single();

  if (insertError) {
    return NextResponse.json(
      { message: `Failed to create dietary profile: ${insertError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ profile: data }, { status: 201 });
}
