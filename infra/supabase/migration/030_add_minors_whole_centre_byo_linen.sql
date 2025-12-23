-- 030_add_minors_whole_centre_byo_linen.sql
-- Adds minors and whole_centre boolean fields to bookings
-- Updates accommodation_requests to handle byo_linen
-- Replaces 'Whole Centre Day Hire' space with whole_centre flag

BEGIN;

-- 1. Add new boolean columns to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS minors boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS whole_centre boolean NOT NULL DEFAULT false;

-- 2. Deactivate 'Whole Centre Day Hire' space (replaced by whole_centre flag)
UPDATE public.spaces
SET active = false
WHERE id = 'Whole Centre Day Hire';

-- 3. Update the upsert_booking_snapshot RPC function
CREATE OR REPLACE FUNCTION public.upsert_booking_snapshot(snap jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bid uuid;
  start_d date;
  end_d date;
  ext_id text := nullif(snap->>'bookingId','');
  form_id text := nullif(snap->>'formResponseId','');
  start_ts timestamptz;
  end_ts timestamptz;
BEGIN
  -- Parse dates from timestamps (handles both date and timestamp strings)
  BEGIN
    start_ts := (snap->'range'->>'start')::timestamptz;
    start_d := start_ts::date;
  EXCEPTION WHEN OTHERS THEN
    start_d := (snap->'range'->>'start')::date;
  END;

  BEGIN
    end_ts := (snap->'range'->>'end')::timestamptz;
    end_d := end_ts::date;
  EXCEPTION WHEN OTHERS THEN
    end_d := (snap->'range'->>'end')::date;
  END;

  -- Try to update existing booking first
  UPDATE public.bookings AS b SET
    customer_email     = snap->>'email',
    customer_name      = snap->>'org',
    contact_name       = coalesce(nullif(snap->>'contactName',''), b.contact_name),
    contact_phone      = coalesce(nullif(snap->>'contactPhone',''), b.contact_phone),
    booking_type       = coalesce(nullif(snap->>'bookingType',''), case when coalesce(snap->>'org','') <> '' then 'Group' else 'Individual' end),
    event_type         = coalesce(nullif(snap->>'eventType',''), b.event_type),
    is_overnight       = coalesce((snap->>'overnight')::boolean, true),
    headcount          = coalesce((snap->>'headcount')::int, 0),
    minors             = coalesce((snap->>'minors')::boolean, false),
    whole_centre       = coalesce((snap->>'whole_centre')::boolean, false),
    arrival_date       = start_d,
    departure_date     = end_d,
    catering_required  = coalesce((snap->'catering'->>'required')::boolean, false),
    chapel_required    = coalesce((snap->>'chapelRequired')::boolean, b.chapel_required),
    status             = coalesce(nullif(snap->>'status','')::public.booking_status, b.status),
    notes              = snap->>'notes',
    form_response_id   = coalesce(form_id, b.form_response_id),
    external_id        = coalesce(ext_id, b.external_id),
    accommodation_requests = coalesce(snap->'accommodation', b.accommodation_requests, '{}'::jsonb),
    updated_at         = now()
  WHERE
    (ext_id is not null and b.external_id = ext_id)
    or (form_id is not null and b.form_response_id = form_id)
  RETURNING id INTO bid;

  -- If no existing booking found, insert new one
  IF bid IS NULL THEN
    INSERT INTO public.bookings (
      external_id,
      form_response_id,
      customer_email,
      customer_name,
      contact_name,
      contact_phone,
      booking_type,
      event_type,
      is_overnight,
      headcount,
      minors,
      whole_centre,
      arrival_date,
      departure_date,
      catering_required,
      chapel_required,
      status,
      notes,
      accommodation_requests
    ) VALUES (
      ext_id,
      form_id,
      snap->>'email',
      snap->>'org',
      nullif(snap->>'contactName',''),
      nullif(snap->>'contactPhone',''),
      coalesce(nullif(snap->>'bookingType',''), case when coalesce(snap->>'org','') <> '' then 'Group' else 'Individual' end),
      nullif(snap->>'eventType',''),
      coalesce((snap->>'overnight')::boolean, true),
      coalesce((snap->>'headcount')::int, 0),
      coalesce((snap->>'minors')::boolean, false),
      coalesce((snap->>'whole_centre')::boolean, false),
      start_d,
      end_d,
      coalesce((snap->'catering'->>'required')::boolean, false),
      coalesce((snap->>'chapelRequired')::boolean, false),
      coalesce(nullif(snap->>'status','')::public.booking_status, 'Pending'),
      snap->>'notes',
      coalesce(snap->'accommodation', '{}'::jsonb)
    )
    ON CONFLICT (external_id) DO UPDATE SET
      customer_email     = excluded.customer_email,
      customer_name      = excluded.customer_name,
      contact_name       = coalesce(excluded.contact_name, bookings.contact_name),
      contact_phone      = coalesce(excluded.contact_phone, bookings.contact_phone),
      booking_type       = excluded.booking_type,
      event_type         = coalesce(excluded.event_type, bookings.event_type),
      is_overnight       = excluded.is_overnight,
      headcount          = excluded.headcount,
      minors             = excluded.minors,
      whole_centre       = excluded.whole_centre,
      arrival_date       = excluded.arrival_date,
      departure_date     = excluded.departure_date,
      catering_required  = excluded.catering_required,
      chapel_required    = excluded.chapel_required,
      status             = excluded.status,
      notes              = excluded.notes,
      form_response_id   = coalesce(excluded.form_response_id, bookings.form_response_id),
      accommodation_requests = excluded.accommodation_requests,
      updated_at         = now()
    RETURNING id INTO bid;
  END IF;

  -- Fallback: try to find by external_id if still null
  IF bid IS NULL THEN
    SELECT id INTO bid FROM public.bookings WHERE external_id = ext_id;
  END IF;

  -- If we still don't have a booking ID, raise an error
  IF bid IS NULL THEN
    RAISE EXCEPTION 'Failed to upsert booking - no booking ID found';
  END IF;

  -- Delete existing 'Held' space reservations for this booking
  DELETE FROM public.space_reservations
  WHERE booking_id = bid AND status = 'Held';

  -- Insert space reservations based on requested spaces or whole_centre flag
  WITH requested_spaces AS (
    SELECT DISTINCT trim(s)::text AS space_id
    FROM jsonb_array_elements_text(coalesce(snap->'spaces','[]'::jsonb)) AS t(s)
    WHERE trim(s) <> 'Whole Centre Day Hire' -- Exclude the deprecated space
  ),
  whole_centre_flag AS (
    SELECT coalesce((snap->>'whole_centre')::boolean, false) AS is_whole_centre
  ),
  spaces_for_booking AS (
    SELECT s.id AS space_id
    FROM public.spaces s
    WHERE s.active
      AND (
        -- Include explicitly requested spaces (excluding deprecated 'Whole Centre Day Hire')
        s.id IN (SELECT space_id FROM requested_spaces)
        -- OR include all active spaces if whole_centre flag is true
        OR (SELECT is_whole_centre FROM whole_centre_flag)
      )
  )
  INSERT INTO public.space_reservations (booking_id, space_id, service_date, status)
  SELECT bid, sf.space_id, g::date, 'Held'
  FROM spaces_for_booking sf
  CROSS JOIN generate_series(start_d, end_d, interval '1 day') AS g;

  -- Delete existing draft meal jobs for this booking
  DELETE FROM public.meal_jobs
  WHERE booking_id = bid AND status = 'Draft';

  -- Insert meal jobs from snapshot
  INSERT INTO public.meal_jobs (booking_id, service_date, meal, counts_total, counts_by_diet, percolated_coffee, status)
  SELECT
    bid,
    (m->>'date')::date,
    (m->>'meal')::public.meal_type,
    coalesce((m->>'count')::int, 0),
    coalesce(m->'dietaryCounts','{}'::jsonb),
    coalesce((m->>'percolatedCoffee')::boolean, false),
    'Draft'
  FROM jsonb_array_elements(coalesce(snap->'catering'->'meals','[]'::jsonb)) m;

  -- Log the upsert action
  INSERT INTO public.audit_log(entity, entity_id, action, changes)
  VALUES ('booking', bid, 'snapshot_upsert', jsonb_build_object('v', snap->>'v'));

  RETURN bid;
END;
$$;

COMMIT;
