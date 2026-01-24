-- Migration: Booking Detail Function for Performance
-- Creates function to fetch complete booking details with all related data in a single query

-- Type for booking detail response (includes all related data)
-- Note: This function returns JSONB to accommodate complex nested data structures

CREATE OR REPLACE FUNCTION get_booking_detail(p_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_result jsonb;
  v_booking jsonb;
  v_spaces jsonb;
  v_reservations jsonb;
  v_conflicts jsonb;
BEGIN
  -- Get the main booking record
  SELECT to_jsonb(b.*) INTO v_booking
  FROM bookings b
  WHERE b.id = p_booking_id;

  -- Return null if booking not found
  IF v_booking IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get space names for this booking
  SELECT COALESCE(jsonb_agg(DISTINCT s.name ORDER BY s.name), '[]'::jsonb)
  INTO v_spaces
  FROM space_reservations sr
  JOIN spaces s ON s.id = sr.space_id
  WHERE sr.booking_id = p_booking_id;

  -- Get all space reservations for this booking
  SELECT COALESCE(jsonb_agg(to_jsonb(sr.*) ORDER BY sr.service_date), '[]'::jsonb)
  INTO v_reservations
  FROM space_reservations sr
  WHERE sr.booking_id = p_booking_id;

  -- Get conflicts from the view
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'booking_id', c.booking_id,
        'space_id', c.space_id,
        'service_date', c.service_date,
        'conflicts_with', c.conflicts_with
      )
      ORDER BY c.service_date
    ),
    '[]'::jsonb
  )
  INTO v_conflicts
  FROM v_space_conflicts c
  WHERE c.booking_id = p_booking_id;

  -- Build the complete result
  v_result := v_booking
    || jsonb_build_object('spaces', v_spaces)
    || jsonb_build_object('reservations', v_reservations)
    || jsonb_build_object('conflicts', v_conflicts);

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_booking_detail(uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_booking_detail(uuid) IS
  'Returns complete booking details with spaces, reservations, and conflicts in a single query. Returns JSONB for easy consumption.';
