// @ts-nocheck
"use server";

import { revalidateTag } from "next/cache";
import { sbServer } from "@/lib/supabase-server";
import { CACHE_TAGS } from "@/lib/cache";

async function getStaffProfile() {
  const supabase = await sbServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();
  if (!profile || !["staff", "admin"].includes(profile.role)) {
    throw new Error("Staff access required");
  }
  return { supabase, userId: profile.id };
}

// ============================================================
// SHIFTS
// ============================================================

export async function endShift(shiftId: string) {
  const { supabase, userId } = await getStaffProfile();

  // Verify the staff member is assigned and accepted
  const { data: assignment } = await supabase
    .from("shift_assignments")
    .select("id")
    .eq("shift_id", shiftId)
    .eq("staff_profile_id", userId)
    .eq("status", "Accepted")
    .single();

  if (!assignment) throw new Error("You are not assigned to this shift.");

  const { error } = await supabase
    .from("shifts")
    .update({ status: "Completed" })
    .eq("id", shiftId)
    .in("status", ["Published", "InProgress"]);

  if (error) throw new Error(`Failed to end shift: ${error.message}`);
  revalidateTag(CACHE_TAGS.SHIFTS);
}

// ============================================================
// SHIFT ASSIGNMENTS
// ============================================================

export async function respondToShiftAssignment(
  assignmentId: string,
  accept: boolean
) {
  const { supabase, userId } = await getStaffProfile();

  const { error } = await supabase
    .from("shift_assignments")
    .update({
      status: accept ? "Accepted" : "Declined",
      responded_at: new Date().toISOString(),
    })
    .eq("id", assignmentId)
    .eq("staff_profile_id", userId);

  if (error) throw new Error(`Failed to respond to assignment: ${error.message}`);
  revalidateTag(CACHE_TAGS.SHIFT_ASSIGNMENTS);
}

// ============================================================
// TIMESHEETS
// ============================================================

function validateBreakRule(data: {
  work_start: string;
  work_end: string;
  break_start?: string | null;
  break_end?: string | null;
}) {
  const [ws_h, ws_m] = data.work_start.split(":").map(Number);
  const [we_h, we_m] = data.work_end.split(":").map(Number);
  const workMinutes = (we_h * 60 + we_m) - (ws_h * 60 + ws_m);

  // Scaled: 30 min per 5-hour tier (0–4:59 = none, 5–9:59 = 30m, 10–14:59 = 60m, …)
  const requiredBreakMinutes = Math.floor(workMinutes / 300) * 30;

  if (requiredBreakMinutes > 0) {
    if (!data.break_start || !data.break_end) {
      throw new Error(`A ${requiredBreakMinutes}-minute break is required for shifts of this length.`);
    }
    const [bs_h, bs_m] = data.break_start.split(":").map(Number);
    const [be_h, be_m] = data.break_end.split(":").map(Number);
    const breakMinutes = (be_h * 60 + be_m) - (bs_h * 60 + bs_m);
    if (breakMinutes < requiredBreakMinutes) {
      throw new Error(`Break must be at least ${requiredBreakMinutes} minutes for this shift length.`);
    }
  }
}

export async function submitTimesheet(data: {
  work_date: string;
  work_start: string;
  work_end: string;
  break_start?: string | null;
  break_end?: string | null;
  notes?: string | null;
  shift_id?: string | null;
  completed_task_ids?: string[];
}) {
  validateBreakRule(data);
  const { supabase, userId } = await getStaffProfile();

  const { error } = await supabase.from("timesheets").insert({
    staff_profile_id: userId,
    work_date: data.work_date,
    work_start: data.work_start,
    work_end: data.work_end,
    break_start: data.break_start ?? null,
    break_end: data.break_end ?? null,
    notes: data.notes ?? null,
    shift_id: data.shift_id ?? null,
    completed_task_ids: data.completed_task_ids ?? [],
    status: "Submitted",
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("You already have a timesheet for this date.");
    }
    throw new Error(`Failed to submit timesheet: ${error.message}`);
  }
  revalidateTag(CACHE_TAGS.TIMESHEETS);
}

export async function updateTimesheet(
  timesheetId: string,
  data: {
    work_start: string;
    work_end: string;
    break_start?: string | null;
    break_end?: string | null;
    notes?: string | null;
  }
) {
  validateBreakRule(data);
  const { supabase, userId } = await getStaffProfile();

  const { error } = await supabase
    .from("timesheets")
    .update({
      work_start: data.work_start,
      work_end: data.work_end,
      break_start: data.break_start ?? null,
      break_end: data.break_end ?? null,
      notes: data.notes ?? null,
      status: "Submitted",
      rejection_reason: null,
    })
    .eq("id", timesheetId)
    .eq("staff_profile_id", userId)
    .in("status", ["Draft", "Rejected"]);

  if (error) throw new Error(`Failed to update timesheet: ${error.message}`);
  revalidateTag(CACHE_TAGS.TIMESHEETS);
}

// ============================================================
// UNAVAILABILITY PERIODS
// ============================================================

export async function submitUnavailabilityPeriod(data: {
  start_date: string;
  end_date: string;
  reason?: string | null;
}) {
  const { supabase, userId } = await getStaffProfile();

  const { error } = await supabase.from("unavailability_periods").insert({
    staff_profile_id: userId,
    start_date: data.start_date,
    end_date: data.end_date,
    reason: data.reason ?? null,
  });

  if (error) throw new Error(`Failed to submit unavailability: ${error.message}`);
  revalidateTag(CACHE_TAGS.UNAVAILABILITY_PERIODS);
}

export async function deleteUnavailabilityPeriod(periodId: string) {
  const { supabase, userId } = await getStaffProfile();

  const { error } = await supabase
    .from("unavailability_periods")
    .delete()
    .eq("id", periodId)
    .eq("staff_profile_id", userId);

  if (error) throw new Error(`Failed to delete unavailability period: ${error.message}`);
  revalidateTag(CACHE_TAGS.UNAVAILABILITY_PERIODS);
}

// ============================================================
// WEEKLY UNAVAILABILITY
// ============================================================

export async function saveWeeklyUnavailability(
  blocks: { day_of_week: string; start_time: string; end_time: string }[]
) {
  const { supabase, userId } = await getStaffProfile();

  // Atomic replace: delete all existing rows then insert new ones
  const { error: deleteError } = await supabase
    .from("weekly_unavailability")
    .delete()
    .eq("staff_profile_id", userId);

  if (deleteError) throw new Error(`Failed to save weekly schedule: ${deleteError.message}`);

  if (blocks.length > 0) {
    const { error: insertError } = await supabase.from("weekly_unavailability").insert(
      blocks.map((b) => ({
        staff_profile_id: userId,
        day_of_week: b.day_of_week,
        start_time: b.start_time,
        end_time: b.end_time,
      }))
    );
    if (insertError) throw new Error(`Failed to save weekly schedule: ${insertError.message}`);
  }

  revalidateTag(CACHE_TAGS.WEEKLY_UNAVAILABILITY);
}
