-- Migration: Booking Aggregations for Performance
-- Creates functions to efficiently compute booking status counts

-- Function to get booking status counts
-- This eliminates the need to count statuses in the application layer
CREATE OR REPLACE FUNCTION get_booking_status_counts()
RETURNS TABLE(status booking_status, count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT
    status,
    COUNT(*)::bigint as count
  FROM bookings
  WHERE status IS NOT NULL
  GROUP BY status;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_booking_status_counts() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_booking_status_counts() IS
  'Returns count of bookings grouped by status. Used for dashboard statistics and filters.';

-- Create optimized booking list view with pre-computed space and conflict data
CREATE OR REPLACE VIEW v_booking_list AS
SELECT
  b.*,
  COALESCE(
    (
      SELECT array_agg(DISTINCT s.name ORDER BY s.name)
      FROM space_reservations sr
      JOIN spaces s ON s.id = sr.space_id
      WHERE sr.booking_id = b.id
    ),
    ARRAY[]::text[]
  ) as spaces,
  COALESCE(
    (
      SELECT COUNT(*)::int
      FROM v_space_conflicts c
      WHERE c.booking_id = b.id
    ),
    0
  ) as conflict_count
FROM bookings b;

-- Grant select permission to authenticated users
GRANT SELECT ON v_booking_list TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW v_booking_list IS
  'Optimized view of bookings with pre-computed space names and conflict counts. Reduces N+1 queries for list views.';
