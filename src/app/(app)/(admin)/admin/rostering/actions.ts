// @ts-nocheck
"use server";

import { revalidateTag } from "next/cache";
import { sbServer } from "@/lib/supabase-server";
import { sbAdmin } from "@/lib/supabase-admin";
import { ensureStaffUser } from "@/lib/auth/admin-actions";
import { CACHE_TAGS } from "@/lib/cache";

async function getAdminProfile() {
  const supabase = await sbServer();
  const [{ data: { user } }, ] = await Promise.all([supabase.auth.getUser()]);
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") throw new Error("Admin access required");
  return { supabase, userId: profile.id };
}

// ============================================================
// SHIFTS
// ============================================================

export async function createShift(data: {
  title: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  staff_profile_ids: string[];
  roster_task_ids: string[];
}) {
  const { supabase, userId } = await getAdminProfile();

  // Use an RPC-style transaction via multiple writes. If any fail after the
  // shift insert, we clean up the shift row (best-effort rollback).
  const { data: shift, error } = await supabase
    .from("shifts")
    .insert({
      title: data.title,
      shift_date: data.shift_date,
      start_time: data.start_time,
      end_time: data.end_time,
      notes: data.notes,
      status: "Published",
      created_by: userId,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create shift: ${error.message}`);

  try {
    // Insert assignments and tasks in parallel
    await Promise.all([
      data.staff_profile_ids.length > 0
        ? supabase.from("shift_assignments").insert(
            data.staff_profile_ids.map((staffId) => ({
              shift_id: shift.id,
              staff_profile_id: staffId,
              status: "Pending",
            }))
          )
        : Promise.resolve(),
      data.roster_task_ids.length > 0
        ? supabase.from("shift_tasks").insert(
            data.roster_task_ids.map((taskId, i) => ({
              shift_id: shift.id,
              roster_task_id: taskId,
              sort_order: i,
            }))
          )
        : Promise.resolve(),
    ]);
  } catch (err) {
    // Best-effort rollback: delete the orphaned shift row
    await supabase.from("shifts").delete().eq("id", shift.id);
    throw new Error(`Failed to create shift (rolled back): ${err instanceof Error ? err.message : err}`);
  }

  revalidateTag(CACHE_TAGS.SHIFTS);
  revalidateTag(CACHE_TAGS.SHIFT_ASSIGNMENTS);
}

export async function updateShift(
  shiftId: string,
  data: {
    title: string;
    shift_date: string;
    start_time: string;
    end_time: string;
    notes: string | null;
    staff_profile_ids: string[];
    roster_task_ids: string[];
  }
) {
  const { supabase } = await getAdminProfile();

  // Fetch existing assignments to diff — preserve accepted/declined responses
  const { data: existing } = await supabase
    .from("shift_assignments")
    .select("id, staff_profile_id, status, responded_at")
    .eq("shift_id", shiftId);

  const existingMap = new Map(
    (existing ?? []).map((a) => [a.staff_profile_id, a])
  );
  const newSet = new Set(data.staff_profile_ids);

  // Determine adds and removes
  const toRemove = (existing ?? [])
    .filter((a) => !newSet.has(a.staff_profile_id))
    .map((a) => a.id);
  const toAdd = data.staff_profile_ids.filter((id) => !existingMap.has(id));

  await Promise.all([
    // Update shift core fields
    supabase
      .from("shifts")
      .update({
        title: data.title,
        shift_date: data.shift_date,
        start_time: data.start_time,
        end_time: data.end_time,
        notes: data.notes,
      })
      .eq("id", shiftId),

    // Remove de-assigned staff
    toRemove.length > 0
      ? supabase.from("shift_assignments").delete().in("id", toRemove)
      : Promise.resolve(),

    // Add newly assigned staff (Pending status only for new assignments)
    toAdd.length > 0
      ? supabase.from("shift_assignments").insert(
          toAdd.map((staffId) => ({
            shift_id: shiftId,
            staff_profile_id: staffId,
            status: "Pending",
          }))
        )
      : Promise.resolve(),

    // Replace tasks (tasks have no user-state to preserve)
    supabase
      .from("shift_tasks")
      .delete()
      .eq("shift_id", shiftId)
      .then(() =>
        data.roster_task_ids.length > 0
          ? supabase.from("shift_tasks").insert(
              data.roster_task_ids.map((taskId, i) => ({
                shift_id: shiftId,
                roster_task_id: taskId,
                sort_order: i,
              }))
            )
          : Promise.resolve()
      ),
  ]);

  revalidateTag(CACHE_TAGS.SHIFTS);
  revalidateTag(CACHE_TAGS.SHIFT_ASSIGNMENTS);
}

export async function deleteShift(shiftId: string) {
  const { supabase } = await getAdminProfile();
  const { error } = await supabase.from("shifts").delete().eq("id", shiftId);
  if (error) throw new Error(`Failed to delete shift: ${error.message}`);
  revalidateTag(CACHE_TAGS.SHIFTS);
  revalidateTag(CACHE_TAGS.SHIFT_ASSIGNMENTS);
}


// ============================================================
// ROSTER JOBS
// ============================================================

export async function createRosterJob(data: {
  name: string;
  description?: string;
  color: string;
  sort_order: number;
}) {
  const { supabase } = await getAdminProfile();
  const { error } = await supabase.from("roster_jobs").insert(data);
  if (error) throw new Error(`Failed to create job: ${error.message}`);
  revalidateTag(CACHE_TAGS.ROSTER_JOBS);
}

export async function updateRosterJob(
  jobId: string,
  data: { name: string; description?: string; color: string; sort_order: number }
) {
  const { supabase } = await getAdminProfile();
  const { error } = await supabase.from("roster_jobs").update(data).eq("id", jobId);
  if (error) throw new Error(`Failed to update job: ${error.message}`);
  revalidateTag(CACHE_TAGS.ROSTER_JOBS);
}

export async function deleteRosterJob(jobId: string) {
  const { supabase } = await getAdminProfile();
  const { error } = await supabase.from("roster_jobs").delete().eq("id", jobId);
  if (error) throw new Error(`Failed to delete job: ${error.message}`);
  revalidateTag(CACHE_TAGS.ROSTER_JOBS);
  revalidateTag(CACHE_TAGS.ROSTER_TASKS);
}

// ============================================================
// ROSTER TASKS
// ============================================================

export async function createRosterTask(data: {
  roster_job_id: string;
  name: string;
  description?: string;
  estimated_minutes?: number;
  sort_order: number;
}) {
  const { supabase } = await getAdminProfile();
  const { error } = await supabase.from("roster_tasks").insert(data);
  if (error) throw new Error(`Failed to create task: ${error.message}`);
  revalidateTag(CACHE_TAGS.ROSTER_TASKS);
  revalidateTag(CACHE_TAGS.ROSTER_JOBS);
}

export async function updateRosterTask(
  taskId: string,
  data: { name: string; description?: string; estimated_minutes?: number; sort_order: number }
) {
  const { supabase } = await getAdminProfile();
  const { error } = await supabase.from("roster_tasks").update(data).eq("id", taskId);
  if (error) throw new Error(`Failed to update task: ${error.message}`);
  revalidateTag(CACHE_TAGS.ROSTER_TASKS);
  revalidateTag(CACHE_TAGS.ROSTER_JOBS);
}

export async function deleteRosterTask(taskId: string) {
  const { supabase } = await getAdminProfile();
  const { error } = await supabase.from("roster_tasks").delete().eq("id", taskId);
  if (error) throw new Error(`Failed to delete task: ${error.message}`);
  revalidateTag(CACHE_TAGS.ROSTER_TASKS);
  revalidateTag(CACHE_TAGS.ROSTER_JOBS);
}

export async function reorderRosterJobs(jobIds: string[]) {
  const { supabase } = await getAdminProfile();
  await Promise.all(
    jobIds.map((id, index) =>
      supabase.from("roster_jobs").update({ sort_order: index }).eq("id", id)
    )
  );
  revalidateTag(CACHE_TAGS.ROSTER_JOBS);
}

export async function reorderRosterTasks(jobId: string, taskIds: string[]) {
  const { supabase } = await getAdminProfile();
  await Promise.all(
    taskIds.map((id, index) =>
      supabase.from("roster_tasks").update({ sort_order: index }).eq("id", id)
    )
  );
  revalidateTag(CACHE_TAGS.ROSTER_TASKS);
  revalidateTag(CACHE_TAGS.ROSTER_JOBS);
}

// ============================================================
// TIMESHEETS
// ============================================================

export async function approveTimesheet(timesheetId: string) {
  const { supabase, userId } = await getAdminProfile();
  const { error } = await supabase
    .from("timesheets")
    .update({ status: "Approved", reviewed_by: userId, rejection_reason: null })
    .eq("id", timesheetId);
  if (error) throw new Error(`Failed to approve timesheet: ${error.message}`);
  revalidateTag(CACHE_TAGS.TIMESHEETS);
}

export async function rejectTimesheet(timesheetId: string, reason: string) {
  const { supabase, userId } = await getAdminProfile();
  const { error } = await supabase
    .from("timesheets")
    .update({ status: "Rejected", reviewed_by: userId, rejection_reason: reason })
    .eq("id", timesheetId);
  if (error) throw new Error(`Failed to reject timesheet: ${error.message}`);
  revalidateTag(CACHE_TAGS.TIMESHEETS);
}

export async function bulkApproveTimesheets(timesheetIds: string[]) {
  const { supabase, userId } = await getAdminProfile();
  const { error } = await supabase
    .from("timesheets")
    .update({ status: "Approved", reviewed_by: userId, rejection_reason: null })
    .in("id", timesheetIds)
    .eq("status", "Submitted");
  if (error) throw new Error(`Failed to bulk approve: ${error.message}`);
  revalidateTag(CACHE_TAGS.TIMESHEETS);
}

function validateBreakRuleAdmin(data: {
  work_start: string;
  work_end: string;
  break_start?: string | null;
  break_end?: string | null;
}) {
  const [ws_h, ws_m] = data.work_start.split(":").map(Number);
  const [we_h, we_m] = data.work_end.split(":").map(Number);
  const workMinutes = (we_h * 60 + we_m) - (ws_h * 60 + ws_m);
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

export async function adjustTimesheet(
  timesheetId: string,
  data: {
    work_start: string;
    work_end: string;
    break_start?: string | null;
    break_end?: string | null;
    notes?: string | null;
    approve: boolean;
  }
) {
  validateBreakRuleAdmin(data);
  const { supabase, userId } = await getAdminProfile();

  const updateData: Record<string, unknown> = {
    work_start: data.work_start,
    work_end: data.work_end,
    break_start: data.break_start ?? null,
    break_end: data.break_end ?? null,
    notes: data.notes ?? null,
  };

  if (data.approve) {
    updateData.status = "Approved";
    updateData.reviewed_by = userId;
    updateData.rejection_reason = null;
  }

  const { error } = await supabase
    .from("timesheets")
    .update(updateData)
    .eq("id", timesheetId);

  if (error) throw new Error(`Failed to adjust timesheet: ${error.message}`);
  revalidateTag(CACHE_TAGS.TIMESHEETS);
}


// ============================================================
// STAFF RECORDS
// ============================================================

export async function createStaffMember(data: {
  email: string;
  full_name: string;
  phone?: string;
  position?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
}) {
  // ensureStaffUser creates the auth user + profiles row via sbAdmin()
  const profileId = await ensureStaffUser(data.email, data.full_name);

  // Use sbAdmin() for the staff_records upsert to avoid RLS timing issues
  // (the new profiles row may not yet be visible to the RLS-enforced client)
  const admin = sbAdmin();
  const { error } = await admin.from("staff_records").upsert(
    {
      profile_id: profileId,
      phone: data.phone ?? null,
      position: data.position ?? null,
      emergency_contact_name: data.emergency_contact_name ?? null,
      emergency_contact_phone: data.emergency_contact_phone ?? null,
      notes: data.notes ?? null,
      active: true,
    },
    { onConflict: "profile_id" }
  );

  if (error) throw new Error(`Failed to create staff record: ${error.message}`);
  revalidateTag(CACHE_TAGS.STAFF_RECORDS);
}

export async function updateStaffRecord(
  recordId: string,
  data: {
    phone?: string | null;
    position?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    notes?: string | null;
    active?: boolean;
  }
) {
  const { supabase } = await getAdminProfile();
  const { error } = await supabase.from("staff_records").update(data).eq("id", recordId);
  if (error) throw new Error(`Failed to update staff record: ${error.message}`);
  revalidateTag(CACHE_TAGS.STAFF_RECORDS);
}

export async function deactivateStaffMember(recordId: string) {
  const { supabase } = await getAdminProfile();
  const { error } = await supabase
    .from("staff_records")
    .update({ active: false })
    .eq("id", recordId);
  if (error) throw new Error(`Failed to deactivate staff: ${error.message}`);
  revalidateTag(CACHE_TAGS.STAFF_RECORDS);
}
