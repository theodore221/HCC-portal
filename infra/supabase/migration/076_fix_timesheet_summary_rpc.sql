-- Migration 076: Fix ambiguous 'id' column reference in get_timesheet_summary
-- The RETURNS TABLE(id uuid, ...) creates a PL/pgSQL OUT variable named 'id' that
-- conflicts with profiles.id in the WHERE clause. Fix by qualifying with table name.

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
  -- Qualify profiles.id explicitly to avoid ambiguity with the 'id' OUT parameter
  SELECT profiles.role INTO v_role FROM profiles WHERE profiles.id = v_uid;

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
