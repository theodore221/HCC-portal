import { NextRequest, NextResponse } from "next/server";
import { getShiftsForDate } from "@/lib/queries/rostering.server";

export async function GET(req: NextRequest) {
  const date = new URL(req.url).searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date required" }, { status: 400 });
  }
  const data = await getShiftsForDate(date);
  return NextResponse.json(data);
}
