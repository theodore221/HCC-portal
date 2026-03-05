-- Migration 065: Rostering Patch
-- Applies fixes from code review without re-running full migrations 062/063/064.
-- Run this if you applied the original 062/063/064 migrations before the fixes were written.
-- Safe to run even if 062/063/064 were not applied (DROP IF EXISTS everywhere).

-- ============================================================
-- PATCH A: Trigger function with pinned search_path (062 fix)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Re-apply triggers idempotently (DROP IF EXISTS before CREATE)
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'staff_records', 'roster_jobs', 'roster_tasks',
    'shifts', 'shift_assignments', 'timesheets', 'leave_requests'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I;
       CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t, t, t, t
    );
  END LOOP;
END;
$$;

-- Missing composite indexes (062 fix)
CREATE INDEX IF NOT EXISTS idx_leave_requests_staff_status ON leave_requests(staff_profile_id, status);
CREATE INDEX IF NOT EXISTS idx_timesheets_staff_status ON timesheets(staff_profile_id, status);

-- ============================================================
-- PATCH B: Fix RLS policies — add WITH CHECK to admin FOR ALL,
--          scope staff read policies to role='staff' only,
--          and add WITH CHECK to staff timesheet update (063 fixes)
-- ============================================================

-- STAFF RECORDS
DROP POLICY IF EXISTS "admin_all_staff_records" ON staff_records;
CREATE POLICY "admin_all_staff_records" ON staff_records
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ROSTER JOBS
DROP POLICY IF EXISTS "admin_all_roster_jobs" ON roster_jobs;
CREATE POLICY "admin_all_roster_jobs" ON roster_jobs
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "staff_read_roster_jobs" ON roster_jobs;
CREATE POLICY "staff_read_roster_jobs" ON roster_jobs
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'staff')
  );

-- ROSTER TASKS
DROP POLICY IF EXISTS "admin_all_roster_tasks" ON roster_tasks;
CREATE POLICY "admin_all_roster_tasks" ON roster_tasks
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "staff_read_roster_tasks" ON roster_tasks;
CREATE POLICY "staff_read_roster_tasks" ON roster_tasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'staff')
  );

-- SHIFTS
DROP POLICY IF EXISTS "admin_all_shifts" ON shifts;
CREATE POLICY "admin_all_shifts" ON shifts
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- SHIFT ASSIGNMENTS
DROP POLICY IF EXISTS "admin_all_shift_assignments" ON shift_assignments;
CREATE POLICY "admin_all_shift_assignments" ON shift_assignments
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- SHIFT TASKS
DROP POLICY IF EXISTS "admin_all_shift_tasks" ON shift_tasks;
CREATE POLICY "admin_all_shift_tasks" ON shift_tasks
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- TIMESHEETS: admin policy + staff update WITH CHECK
DROP POLICY IF EXISTS "admin_all_timesheets" ON timesheets;
CREATE POLICY "admin_all_timesheets" ON timesheets
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Staff update: add WITH CHECK to prevent self-approval
DROP POLICY IF EXISTS "staff_own_timesheets_update" ON timesheets;
CREATE POLICY "staff_own_timesheets_update" ON timesheets
  FOR UPDATE TO authenticated
  USING (
    staff_profile_id = auth.uid() AND
    status IN ('Draft', 'Rejected') AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'staff')
  )
  WITH CHECK (
    staff_profile_id = auth.uid() AND
    status IN ('Draft', 'Submitted')
  );

-- LEAVE REQUESTS
DROP POLICY IF EXISTS "admin_all_leave_requests" ON leave_requests;
CREATE POLICY "admin_all_leave_requests" ON leave_requests
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- PATCH C: Replace RPCs with corrected plpgsql versions (064 fixes)
-- Uses CREATE OR REPLACE — safe to run unconditionally.
-- ============================================================

CREATE OR REPLACE FUNCTION get_shift_calendar_data(
  p_start date,
  p_end   date
)
RETURNS TABLE (
  shift_date           date,
  total_shifts         bigint,
  total_staff_assigned bigint,
  has_unresponded      boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')
  ) THEN
    RAISE EXCEPTION 'Access denied: admin or staff role required';
  END IF;

  RETURN QUERY
  SELECT
    s.shift_date,
    COUNT(DISTINCT s.id)                                  AS total_shifts,
    COUNT(sa.id)                                          AS total_staff_assigned,
    BOOL_OR(sa.status = 'Pending')                        AS has_unresponded
  FROM shifts s
  LEFT JOIN shift_assignments sa ON sa.shift_id = s.id
  WHERE s.shift_date BETWEEN p_start AND p_end
    AND s.status != 'Cancelled'
  GROUP BY s.shift_date
  ORDER BY s.shift_date;
END;
$$;

CREATE OR REPLACE FUNCTION get_shift_detail(p_shift_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Access denied: not authenticated';
  END IF;

  IF v_role = 'staff' THEN
    IF NOT EXISTS (
      SELECT 1 FROM shift_assignments
      WHERE shift_id = p_shift_id AND staff_profile_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Access denied: not assigned to this shift';
    END IF;
  ELSIF v_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: admin or staff role required';
  END IF;

  RETURN (
    SELECT json_build_object(
      'id',         s.id,
      'title',      s.title,
      'shift_date', s.shift_date,
      'start_time', s.start_time,
      'end_time',   s.end_time,
      'notes',      s.notes,
      'status',     s.status,
      'created_by', s.created_by,
      'assignments', COALESCE((
        SELECT json_agg(json_build_object(
          'id',                sa.id,
          'staff_profile_id',  sa.staff_profile_id,
          'staff_name',        p.full_name,
          'staff_email',       p.email,
          'status',            sa.status,
          'responded_at',      sa.responded_at
        ) ORDER BY p.full_name)
        FROM shift_assignments sa
        JOIN profiles p ON p.id = sa.staff_profile_id
        WHERE sa.shift_id = s.id
      ), '[]'::json),
      'tasks', COALESCE((
        SELECT json_agg(json_build_object(
          'id',                 st.id,
          'roster_task_id',     st.roster_task_id,
          'task_name',          rt.name,
          'job_name',           rj.name,
          'job_color',          rj.color,
          'estimated_minutes',  rt.estimated_minutes,
          'sort_order',         st.sort_order
        ) ORDER BY st.sort_order)
        FROM shift_tasks st
        JOIN roster_tasks rt ON rt.id = st.roster_task_id
        JOIN roster_jobs rj ON rj.id = rt.roster_job_id
        WHERE st.shift_id = s.id
      ), '[]'::json)
    )
    FROM shifts s
    WHERE s.id = p_shift_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_timesheet_summary(
  p_staff_id  uuid    DEFAULT NULL,
  p_start     date    DEFAULT NULL,
  p_end       date    DEFAULT NULL,
  p_status    text    DEFAULT NULL
)
RETURNS TABLE (
  id                 uuid,
  staff_profile_id   uuid,
  staff_name         text,
  work_date          date,
  work_start         time,
  work_end           time,
  break_start        time,
  break_end          time,
  status             timesheet_status,
  shift_id           uuid,
  reviewed_by        uuid,
  rejection_reason   text,
  notes              text,
  working_minutes    numeric,
  break_minutes      numeric,
  created_at         timestamptz,
  updated_at         timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_uid  uuid;
BEGIN
  v_uid := auth.uid();
  SELECT role INTO v_role FROM profiles WHERE id = v_uid;

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Access denied: not authenticated';
  END IF;

  IF v_role = 'staff' THEN
    IF p_staff_id IS NOT NULL AND p_staff_id IS DISTINCT FROM v_uid THEN
      RAISE EXCEPTION 'Access denied: staff may only query their own timesheets';
    END IF;
    p_staff_id := v_uid;
  ELSIF v_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: admin or staff role required';
  END IF;

  RETURN QUERY
  SELECT
    t.id,
    t.staff_profile_id,
    p.full_name                                              AS staff_name,
    t.work_date,
    t.work_start,
    t.work_end,
    t.break_start,
    t.break_end,
    t.status,
    t.shift_id,
    t.reviewed_by,
    t.rejection_reason,
    t.notes,
    -- Net payable minutes: gross work minus break
    EXTRACT(EPOCH FROM (t.work_end - t.work_start)) / 60
      - CASE
          WHEN t.break_start IS NOT NULL AND t.break_end IS NOT NULL
          THEN EXTRACT(EPOCH FROM (t.break_end - t.break_start)) / 60
          ELSE 0
        END                                                  AS working_minutes,
    -- Break duration separately for display
    CASE
      WHEN t.break_start IS NOT NULL AND t.break_end IS NOT NULL
      THEN EXTRACT(EPOCH FROM (t.break_end - t.break_start)) / 60
      ELSE 0
    END                                                      AS break_minutes,
    t.created_at,
    t.updated_at
  FROM timesheets t
  JOIN profiles p ON p.id = t.staff_profile_id
  WHERE
    (p_staff_id IS NULL OR t.staff_profile_id = p_staff_id) AND
    (p_start    IS NULL OR t.work_date >= p_start) AND
    (p_end      IS NULL OR t.work_date <= p_end) AND
    (p_status   IS NULL OR t.status::text = p_status)
  ORDER BY t.work_date DESC, p.full_name;
END;
$$;

GRANT EXECUTE ON FUNCTION get_shift_calendar_data(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION get_shift_detail(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_timesheet_summary(uuid, date, date, text) TO authenticated;
