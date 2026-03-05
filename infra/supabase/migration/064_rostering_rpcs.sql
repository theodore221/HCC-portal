-- Migration 064: Rostering RPCs
-- Read-only aggregation functions for the rostering module.
-- All functions are SECURITY DEFINER and explicitly check caller role
-- before executing, since SECURITY DEFINER bypasses RLS entirely.

-- ============================================================
-- get_shift_calendar_data
-- Returns per-day aggregation for a date range (calendar month view)
-- Accessible to: admin and staff only
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
  -- Verify caller is admin or staff (SECURITY DEFINER bypasses RLS)
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

-- ============================================================
-- get_shift_detail
-- Returns a single shift with nested assignments and tasks
-- Accessible to: admin (any shift), staff (only their assigned shifts)
-- ============================================================

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
  -- Get caller role
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Access denied: not authenticated';
  END IF;

  -- Staff may only view shifts they are assigned to
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

-- ============================================================
-- get_timesheet_summary
-- Returns timesheet rows with staff names and net computed hours.
-- working_minutes = gross work duration MINUS break duration (payable hours).
-- Accessible to: admin (any staff), staff (own data only)
-- ============================================================

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

  -- Staff may only query their own timesheets
  IF v_role = 'staff' THEN
    IF p_staff_id IS NOT NULL AND p_staff_id IS DISTINCT FROM v_uid THEN
      RAISE EXCEPTION 'Access denied: staff may only query their own timesheets';
    END IF;
    -- Force filter to own data even if p_staff_id is NULL
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
