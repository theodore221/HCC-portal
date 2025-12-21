import { NextRequest, NextResponse } from "next/server";

import { sbAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body?.email;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const supabase = sbAdmin();

    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", trimmedEmail)
      .maybeSingle();

    if (error) {
      console.error("Error checking email:", error);
      return NextResponse.json(
        { error: "Unable to verify email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { exists: !!data },
    });
  } catch (error) {
    console.error("Error in check-email endpoint:", error);
    return NextResponse.json(
      { error: "Unable to verify email" },
      { status: 500 }
    );
  }
}
