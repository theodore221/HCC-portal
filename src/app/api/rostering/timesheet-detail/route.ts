// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { sbServer } from "@/lib/supabase-server";
import { getShiftDetail } from "@/lib/queries/rostering.server";

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const supabase = await sbServer();

  // Direct query to get full timesheet row including completed_task_ids
  const { data: timesheet, error } = await supabase
    .from("timesheets")
    .select(
      `*, profiles!timesheets_staff_profile_id_fkey(full_name)`
    )
    .eq("id", id)
    .single();

  if (error || !timesheet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = {
    ...timesheet,
    staff_name: timesheet.profiles?.full_name ?? null,
    completed_task_ids: timesheet.completed_task_ids ?? [],
    profiles: undefined,
  };

  // Fetch shift detail if shift_id exists
  let shift = null;
  if (timesheet.shift_id) {
    shift = await getShiftDetail(timesheet.shift_id);
  }

  return NextResponse.json({ timesheet: result, shift });
}
