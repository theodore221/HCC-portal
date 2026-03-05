-- Migration 071: RPC to fetch staff availability for a given shift date/time

-- Returns all staff+admin profiles annotated with:
--   has_period_unavailability  — any period overlaps the shift date
--   has_weekly_unavailability  — recurring schedule overlaps the shift day+time
--   period_reason              — reason text from period unavailability (if any)
--
-- Security: SECURITY DEFINER (bypasses RLS to read all profiles).
-- Caller must be admin or staff — caterers/customers are rejected.

CREATE OR REPLACE FUNCTION get_staff_availability(
  p_shift_date  date,
  p_start_time  time,
  p_end_time    time
)
RETURNS TABLE (
  staff_profile_id          uuid,
  full_name                 text,
  email                     text,
  has_period_unavailability boolean,
  has_weekly_unavailability boolean,
  period_reason             text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Restrict to admin/staff callers only; caterers and customers are rejected
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'staff')
  ) THEN
    RAISE EXCEPTION 'Access denied: insufficient role';
  END IF;

  RETURN QUERY
  WITH dow_map AS (
    -- Map Postgres DOW (0=Sun, 1=Mon…6=Sat) to our day_of_week enum
    SELECT CASE EXTRACT(DOW FROM p_shift_date)
      WHEN 0 THEN 'Sun'::day_of_week
      WHEN 1 THEN 'Mon'::day_of_week
      WHEN 2 THEN 'Tue'::day_of_week
      WHEN 3 THEN 'Wed'::day_of_week
      WHEN 4 THEN 'Thu'::day_of_week
      WHEN 5 THEN 'Fri'::day_of_week
      WHEN 6 THEN 'Sat'::day_of_week
    END AS dow
  ),
  period_conflicts AS (
    -- Pick the most recently created conflicting period per staff member
    SELECT DISTINCT ON (up.staff_profile_id)
      up.staff_profile_id,
      up.reason
    FROM unavailability_periods up
    WHERE up.start_date <= p_shift_date
      AND up.end_date >= p_shift_date
    ORDER BY up.staff_profile_id, up.created_at DESC
  ),
  weekly_conflicts AS (
    SELECT DISTINCT wu.staff_profile_id
    FROM weekly_unavailability wu, dow_map
    WHERE wu.day_of_week = dow_map.dow
      -- Standard open-interval overlap: block starts before shift ends AND block ends after shift starts
      AND wu.start_time < p_end_time
      AND wu.end_time > p_start_time
  )
  SELECT
    p.id                              AS staff_profile_id,
    p.full_name,
    p.email,
    (pc.staff_profile_id IS NOT NULL) AS has_period_unavailability,
    (wc.staff_profile_id IS NOT NULL) AS has_weekly_unavailability,
    pc.reason                         AS period_reason
  FROM profiles p
  LEFT JOIN period_conflicts pc ON pc.staff_profile_id = p.id
  LEFT JOIN weekly_conflicts wc ON wc.staff_profile_id = p.id
  WHERE p.role IN ('staff', 'admin')
  ORDER BY p.full_name;
END;
$$;

GRANT EXECUTE ON FUNCTION get_staff_availability(date, time, time) TO authenticated;
