// @ts-nocheck
import { cache } from "react";
import { sbServer } from "@/lib/supabase-server";

// ============================================================
// Types
// ============================================================

export type ShiftStatus = "Published" | "InProgress" | "Completed";
export type AssignmentStatus = "Pending" | "Accepted" | "Declined" | "NoResponse";
export type TimesheetStatus = "Draft" | "Submitted" | "Approved" | "Rejected";
export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type ShiftCalendarDay = {
  shift_date: string;
  total_shifts: number;
  total_staff_assigned: number;
  has_unresponded: boolean;
  all_accepted: boolean;
};

export type ShiftAssignmentDetail = {
  id: string;
  staff_profile_id: string;
  staff_name: string | null;
  staff_email: string | null;
  status: AssignmentStatus;
  responded_at: string | null;
};

export type ShiftTaskDetail = {
  id: string;
  roster_task_id: string;
  task_name: string;
  job_name: string;
  job_color: string;
  estimated_minutes: number | null;
  sort_order: number;
};

export type ShiftDetail = {
  id: string;
  title: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  status: ShiftStatus;
  created_by: string;
  assignments: ShiftAssignmentDetail[];
  tasks: ShiftTaskDetail[];
};

export type ShiftRow = {
  id: string;
  title: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  status: ShiftStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  assigned_count: number;
};

export type StaffMember = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  staff_record: {
    id: string;
    phone: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    position: string | null;
    notes: string | null;
    active: boolean;
  } | null;
};

export type RosterJob = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  active: boolean;
  sort_order: number;
  tasks: RosterTask[];
};

export type RosterTask = {
  id: string;
  roster_job_id: string;
  name: string;
  description: string | null;
  estimated_minutes: number | null;
  sort_order: number;
  active: boolean;
};

export type TimesheetRow = {
  id: string;
  staff_profile_id: string;
  staff_name: string | null;
  work_date: string;
  work_start: string;
  work_end: string;
  break_start: string | null;
  break_end: string | null;
  status: TimesheetStatus;
  shift_id: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  notes: string | null;
  working_minutes: number;
  break_minutes: number;
  created_at: string;
  updated_at: string;
};

export type UnavailabilityPeriod = {
  id: string;
  staff_profile_id: string;
  staff_name: string | null;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
  updated_at: string;
};

export type WeeklyUnavailabilityRow = {
  id: string;
  staff_profile_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
};

export type StaffAvailability = {
  staff_profile_id: string;
  full_name: string | null;
  email: string;
  has_period_unavailability: boolean;
  has_weekly_unavailability: boolean;
  period_reason: string | null;
};

// ============================================================
// Fortnight Utilities
// ============================================================

/**
 * Returns the start/end dates of the pay-period fortnight containing anchorDate.
 * Pay periods are Saturday–Friday fortnights anchored to 2026-01-03 (a Saturday).
 */
export function getFortnightBounds(anchorDate?: string): { start: string; end: string } {
  // Known anchor Saturday: 2026-01-10 (aligns with pay cycle Feb 21–Mar 6, Mar 7–Mar 20, …)
  const ANCHOR_MS = new Date("2026-01-10T00:00:00").getTime();
  const MS_PER_DAY = 86_400_000;

  const now = new Date();
  const targetMs = anchorDate
    ? new Date(`${anchorDate}T00:00:00`).getTime()
    : new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const daysDiff = Math.floor((targetMs - ANCHOR_MS) / MS_PER_DAY);
  const fortnightIndex = Math.floor(daysDiff / 14);

  const startMs = ANCHOR_MS + fortnightIndex * 14 * MS_PER_DAY;
  const endMs = startMs + 13 * MS_PER_DAY;

  function fmt(ms: number): string {
    const d = new Date(ms);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  return { start: fmt(startMs), end: fmt(endMs) };
}

// ============================================================
// Calendar & Shifts
// ============================================================

export const getShiftCalendarData = cache(
  async (startDate: string, endDate: string): Promise<ShiftCalendarDay[]> => {
    const supabase = await sbServer();
    const { data, error } = await supabase.rpc("get_shift_calendar_data", {
      p_start: startDate,
      p_end: endDate,
    });
    if (error) {
      console.error("getShiftCalendarData error:", error);
      return [];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]) ?? [];
  }
);

export const getShiftDetail = cache(async (shiftId: string): Promise<ShiftDetail | null> => {
  const supabase = await sbServer();
  const { data, error } = await supabase.rpc("get_shift_detail", {
    p_shift_id: shiftId,
  });
  if (error) {
    console.error("getShiftDetail error:", error);
    return null;
  }
  return (data as ShiftDetail) ?? null;
});

export const getShiftsForDate = cache(async (date: string): Promise<ShiftRow[]> => {
  const supabase = await sbServer();
  const { data, error } = await supabase
    .from("shifts")
    .select("*, shift_assignments(id)")
    .eq("shift_date", date)
    .order("start_time");
  if (error) {
    console.error("getShiftsForDate error:", error);
    return [];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((s: any) => ({
    ...s,
    assigned_count: (s.shift_assignments ?? []).length,
  }));
});

// ============================================================
// Staff Members
// ============================================================

export const getStaffMembers = cache(async (): Promise<StaffMember[]> => {
  const supabase = await sbServer();
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      role,
      staff_records (
        id, phone, emergency_contact_name, emergency_contact_phone,
        position, notes, active
      )
    `)
    .in("role", ["staff", "admin"])
    .order("full_name");
  if (error) {
    console.error("getStaffMembers error:", error);
    return [];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((p: any) => ({
    ...p,
    staff_record: Array.isArray(p.staff_records)
      ? (p.staff_records[0] ?? null)
      : (p.staff_records ?? null),
  }));
});

// ============================================================
// Roster Jobs & Tasks
// ============================================================

export const getRosterJobsWithTasks = cache(async (): Promise<RosterJob[]> => {
  const supabase = await sbServer();
  const { data, error } = await supabase
    .from("roster_jobs")
    .select(`
      id, name, description, color, active, sort_order,
      roster_tasks (
        id, roster_job_id, name, description, estimated_minutes, sort_order, active
      )
    `)
    .order("sort_order")
    .order("sort_order", { referencedTable: "roster_tasks" });
  if (error) {
    console.error("getRosterJobsWithTasks error:", error);
    return [];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((j: any) => ({
    ...j,
    tasks: j.roster_tasks ?? [],
  }));
});

// ============================================================
// Timesheets
// ============================================================

export const getTimesheets = cache(
  async (params?: {
    staffId?: string;
    startDate?: string;
    endDate?: string;
    status?: TimesheetStatus;
  }): Promise<TimesheetRow[]> => {
    const supabase = await sbServer();
    const { data, error } = await supabase.rpc("get_timesheet_summary", {
      p_staff_id: params?.staffId ?? null,
      p_start: params?.startDate ?? null,
      p_end: params?.endDate ?? null,
      p_status: params?.status ?? null,
    });
    if (error) {
      console.error("getTimesheets error:", error);
      return [];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]) ?? [];
  }
);

export const getMyTimesheets = cache(
  async (staffId: string): Promise<TimesheetRow[]> => {
    return getTimesheets({ staffId });
  }
);

// ============================================================
// Unavailability Periods
// ============================================================

export const getUnavailabilityPeriods = cache(
  async (): Promise<UnavailabilityPeriod[]> => {
    const supabase = await sbServer();
    const { data, error } = await supabase
      .from("unavailability_periods")
      .select(`
        id, staff_profile_id, start_date, end_date, reason, created_at, updated_at,
        profiles!unavailability_periods_staff_profile_id_fkey (full_name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getUnavailabilityPeriods error:", error);
      return [];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((r: any) => ({
      ...r,
      staff_name: r.profiles?.full_name ?? null,
    }));
  }
);

export const getMyUnavailabilityPeriods = cache(
  async (staffId: string): Promise<UnavailabilityPeriod[]> => {
    const supabase = await sbServer();
    const { data, error } = await supabase
      .from("unavailability_periods")
      .select("id, staff_profile_id, start_date, end_date, reason, created_at, updated_at")
      .eq("staff_profile_id", staffId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getMyUnavailabilityPeriods error:", error);
      return [];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((r: any) => ({ ...r, staff_name: null }));
  }
);

export const getMyWeeklyUnavailability = cache(
  async (staffId: string): Promise<WeeklyUnavailabilityRow[]> => {
    const supabase = await sbServer();
    const { data, error } = await supabase
      .from("weekly_unavailability")
      .select("id, staff_profile_id, day_of_week, start_time, end_time")
      .eq("staff_profile_id", staffId)
      .order("day_of_week")
      .order("start_time");

    if (error) {
      console.error("getMyWeeklyUnavailability error:", error);
      return [];
    }
    return (data as WeeklyUnavailabilityRow[]) ?? [];
  }
);

export const getStaffAvailability = cache(
  async (date: string, startTime: string, endTime: string): Promise<StaffAvailability[]> => {
    const supabase = await sbServer();
    const { data, error } = await supabase.rpc("get_staff_availability", {
      p_shift_date: date,
      p_start_time: startTime,
      p_end_time: endTime,
    });
    if (error) {
      console.error("getStaffAvailability error:", error);
      return [];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]) ?? [];
  }
);

// ============================================================
// Staff: My Shifts
// ============================================================

export type MyShiftRow = ShiftRow & {
  assignment_id: string;
  assignment_status: AssignmentStatus;
  has_timesheet: boolean;
  timesheet_id: string | null;
  timesheet_status: TimesheetStatus | null;
  rejection_reason: string | null;
};

export const getMyShifts = cache(
  async (
    staffId: string,
    startDate?: string,
    endDate?: string
  ): Promise<MyShiftRow[]> => {
    const supabase = await sbServer();
    let query = supabase
      .from("shift_assignments")
      .select(`
        id,
        status,
        shifts (
          id, title, shift_date, start_time, end_time, notes, status,
          created_by, created_at, updated_at
        )
      `)
      .eq("staff_profile_id", staffId)
      .in("shifts.status" as never, ["Published", "InProgress", "Completed"])
      .neq("status", "Declined")
      .order("shifts(shift_date)" as never);

    if (startDate) {
      query = query.gte("shifts.shift_date" as never, startDate);
    }
    if (endDate) {
      query = query.lte("shifts.shift_date" as never, endDate);
    }

    const { data, error } = await query;
    if (error) {
      console.error("getMyShifts error:", error);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (data as any[])
      .filter((row: any) => row.shifts)
      .map((row: any) => ({
        ...row.shifts,
        assignment_id: row.id,
        assignment_status: row.status,
        has_timesheet: false,
        timesheet_id: null,
        timesheet_status: null,
        rejection_reason: null,
      }));

    // Batch-query timesheets to populate has_timesheet + status + rejection_reason
    if (rows.length > 0) {
      const workDates = rows.map((r: MyShiftRow) => r.shift_date);
      const { data: timesheets } = await supabase
        .from("timesheets")
        .select("id, work_date, status, rejection_reason")
        .eq("staff_profile_id", staffId)
        .in("work_date", workDates);

      if (timesheets) {
        const timesheetMap = new Map(
          (timesheets as { id: string; work_date: string; status: TimesheetStatus; rejection_reason: string | null }[])
            .map((t) => [t.work_date, t])
        );
        for (const row of rows) {
          const ts = timesheetMap.get(row.shift_date);
          if (ts) {
            row.has_timesheet = true;
            row.timesheet_id = ts.id;
            row.timesheet_status = ts.status;
            row.rejection_reason = ts.rejection_reason;
          }
        }
      }
    }

    return rows;
  }
);
