import { NextRequest, NextResponse } from "next/server";
import { getStaffAvailability } from "@/lib/queries/rostering.server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const date = searchParams.get("date");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!date || !start || !end) {
    return NextResponse.json(
      { error: "date, start, and end query params are required" },
      { status: 400 }
    );
  }

  try {
    const availability = await getStaffAvailability(date, start, end);
    return NextResponse.json(availability);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
