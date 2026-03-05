import { NextRequest, NextResponse } from "next/server";
import { getShiftCalendarData } from "@/lib/queries/rostering.server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!start || !end) {
    return NextResponse.json({ error: "start and end required" }, { status: 400 });
  }
  const data = await getShiftCalendarData(start, end);
  return NextResponse.json(data);
}
