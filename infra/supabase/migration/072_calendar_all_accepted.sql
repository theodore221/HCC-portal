-- Migration 072: Add all_accepted to get_shift_calendar_data
-- Adds a boolean indicating whether all assigned staff on a given day have accepted their shifts.
-- all_accepted = true only when every shift has ≥1 assignment AND all are 'Accepted'.

-- Must DROP first because the return type (OUT columns) changed
DROP FUNCTION IF EXISTS get_shift_calendar_data(date, date);

CREATE OR REPLACE FUNCTION get_shift_calendar_data(
  p_start date,
  p_end   date
)
RETURNS TABLE (
  shift_date           date,
  total_shifts         bigint,
  total_staff_assigned bigint,
  has_unresponded      boolean,
  all_accepted         boolean
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
    COUNT(DISTINCT s.id)                                        AS total_shifts,
    COUNT(sa.id)                                                AS total_staff_assigned,
    BOOL_OR(sa.status = 'Pending')                              AS has_unresponded,
    -- true only when there is at least one assignment and every assignment is Accepted
    COALESCE(
      COUNT(sa.id) > 0 AND BOOL_AND(sa.id IS NOT NULL AND sa.status = 'Accepted'),
      false
    )                                                           AS all_accepted
  FROM shifts s
  LEFT JOIN shift_assignments sa ON sa.shift_id = s.id
  WHERE s.shift_date BETWEEN p_start AND p_end
  GROUP BY s.shift_date
  ORDER BY s.shift_date;
END;
$$;

GRANT EXECUTE ON FUNCTION get_shift_calendar_data(date, date) TO authenticated;
