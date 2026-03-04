-- Migration 061: Enrich v_space_conflicts view with time ranges and booking statuses
-- This eliminates the ~50-line app-layer conflict computation in page.tsx and enables
-- per-day time-slot conflict detection at the database level.

-- Remove duplicate space_reservations (keep one row per booking+space+date)
DELETE FROM public.space_reservations a
USING public.space_reservations b
WHERE a.ctid > b.ctid
  AND a.booking_id   = b.booking_id
  AND a.space_id     = b.space_id
  AND a.service_date = b.service_date;

-- Add unique constraint so upsert works and duplicate reservations are prevented
ALTER TABLE public.space_reservations
  DROP CONSTRAINT IF EXISTS space_reservations_booking_space_date_key;

ALTER TABLE public.space_reservations
  ADD CONSTRAINT space_reservations_booking_space_date_key
  UNIQUE (booking_id, space_id, service_date);

DROP VIEW IF EXISTS public.v_space_conflicts;

CREATE VIEW public.v_space_conflicts AS
SELECT
  r1.booking_id,
  r1.space_id,
  r1.service_date,
  r1.start_time AS my_start,
  r1.end_time   AS my_end,
  r2.booking_id AS conflicts_with,
  r2.start_time AS other_start,
  r2.end_time   AS other_end,
  b2.status     AS other_status
FROM space_reservations r1
JOIN space_reservations r2
  ON  r1.space_id      = r2.space_id
  AND r1.service_date  = r2.service_date
  AND coalesce(r1.start_time, '00:00') < coalesce(r2.end_time, '23:59')
  AND coalesce(r2.start_time, '00:00') < coalesce(r1.end_time, '23:59')
  AND r1.booking_id   <> r2.booking_id
JOIN bookings b2 ON b2.id = r2.booking_id
WHERE b2.status <> 'Cancelled';
