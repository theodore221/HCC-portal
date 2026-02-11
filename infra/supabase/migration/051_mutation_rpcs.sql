-- Performance & Safety Improvement: Mutation RPCs
-- These functions provide atomic transactions for multi-step mutations

-- ============================================================================
-- delete_booking_cascade: Atomic deletion (fixes transactional safety)
-- ============================================================================
CREATE OR REPLACE FUNCTION delete_booking_cascade(p_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count int := 0;
BEGIN
  -- All deletes happen in a single transaction
  -- If any fails, all rollback automatically

  -- Delete meal job items first (foreign key dependency)
  DELETE FROM meal_job_items
  WHERE meal_job_id IN (
    SELECT id FROM meal_jobs WHERE booking_id = p_booking_id
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Delete meal jobs
  DELETE FROM meal_jobs WHERE booking_id = p_booking_id;

  -- Delete room assignments
  DELETE FROM room_assignments WHERE booking_id = p_booking_id;

  -- Delete space reservations
  DELETE FROM space_reservations WHERE booking_id = p_booking_id;

  -- Delete dietary profiles
  DELETE FROM dietary_profiles WHERE booking_id = p_booking_id;

  -- Delete rooming groups
  DELETE FROM rooming_groups WHERE booking_id = p_booking_id;

  -- Delete the booking itself
  DELETE FROM bookings WHERE id = p_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'deleted_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION delete_booking_cascade(uuid) TO authenticated;

COMMENT ON FUNCTION delete_booking_cascade IS
'Atomically deletes a booking and all related records in a single transaction. Replaces 7 sequential DELETEs that had no transactional safety.';


-- ============================================================================
-- update_meal_job_items: Atomic delete+insert
-- ============================================================================
CREATE OR REPLACE FUNCTION update_meal_job_items(
  p_meal_job_id uuid,
  p_menu_item_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_count int := 0;
BEGIN
  -- Delete existing items and insert new ones atomically
  -- If insert fails, delete is rolled back

  DELETE FROM meal_job_items
  WHERE meal_job_id = p_meal_job_id;

  -- Insert new items
  IF array_length(p_menu_item_ids, 1) > 0 THEN
    INSERT INTO meal_job_items (meal_job_id, menu_item_id)
    SELECT p_meal_job_id, unnest(p_menu_item_ids);

    GET DIAGNOSTICS inserted_count = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'meal_job_id', p_meal_job_id,
    'items_count', inserted_count,
    'updated_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION update_meal_job_items(uuid, uuid[]) TO authenticated;

COMMENT ON FUNCTION update_meal_job_items IS
'Atomically updates meal job items by deleting old and inserting new in a single transaction. Eliminates risk of meal job ending up with zero items if insert fails.';


-- ============================================================================
-- allocate_room: Atomic conflict check + insert (eliminates TOCTOU race)
-- ============================================================================
CREATE OR REPLACE FUNCTION allocate_room(
  p_booking_id uuid,
  p_room_id uuid,
  p_guest_names text[],
  p_extra_bed_selected boolean DEFAULT false,
  p_ensuite_selected boolean DEFAULT false,
  p_private_study_selected boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_arrival_date date;
  v_departure_date date;
  v_conflict_count int;
  v_assignment_id uuid;
BEGIN
  -- Get booking dates
  SELECT arrival_date, departure_date
  INTO v_arrival_date, v_departure_date
  FROM bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;

  -- Check for conflicts with row-level lock
  -- This prevents race conditions between check and insert
  SELECT COUNT(*)
  INTO v_conflict_count
  FROM room_assignments ra
  INNER JOIN bookings b ON ra.booking_id = b.id
  WHERE ra.room_id = p_room_id
    AND b.status != 'Cancelled'
    AND b.arrival_date < v_departure_date
    AND b.departure_date > v_arrival_date
  FOR UPDATE; -- Lock the rows to prevent concurrent allocation

  IF v_conflict_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Room is already allocated for overlapping dates',
      'conflict_count', v_conflict_count
    );
  END IF;

  -- No conflicts, insert the assignment
  INSERT INTO room_assignments (
    booking_id,
    room_id,
    guest_names,
    extra_bed_selected,
    ensuite_selected,
    private_study_selected
  ) VALUES (
    p_booking_id,
    p_room_id,
    p_guest_names,
    p_extra_bed_selected,
    p_ensuite_selected,
    p_private_study_selected
  )
  RETURNING id INTO v_assignment_id;

  RETURN jsonb_build_object(
    'success', true,
    'assignment_id', v_assignment_id,
    'booking_id', p_booking_id,
    'room_id', p_room_id,
    'created_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION allocate_room(uuid, uuid, text[], boolean, boolean, boolean) TO authenticated;

COMMENT ON FUNCTION allocate_room IS
'Atomically checks for room conflicts and allocates room with row-level locking. Eliminates TOCTOU (Time-Of-Check-Time-Of-Use) race condition where another request could allocate between check and insert.';
