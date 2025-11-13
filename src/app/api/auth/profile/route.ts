import { NextResponse } from "next/server";

import { ensureProfileForCurrentUser, markPasswordInitialized } from "@/server/services/profiles";
import { ProfileServiceError } from "@/server/services/profile-domain";

function handleProfileError(error: unknown) {
  if (error instanceof ProfileServiceError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error("Unhandled profile service error", error);
  return NextResponse.json(
    { error: "We couldn't process your profile request. Please try again." },
    { status: 500 }
  );
}

export async function GET() {
  try {
    const profile = await ensureProfileForCurrentUser();
    return NextResponse.json({ data: profile });
  } catch (error) {
    return handleProfileError(error);
  }
}

export async function PATCH() {
  try {
    const profile = await markPasswordInitialized();
    return NextResponse.json({ data: profile });
  } catch (error) {
    return handleProfileError(error);
  }
}

