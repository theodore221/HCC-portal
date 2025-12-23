-- 031_add_arrival_departure_time.sql
-- Adds arrival_time and departure_time columns to bookings table
-- for schedule view display

BEGIN;

-- 1. Add time columns to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS arrival_time time,
ADD COLUMN IF NOT EXISTS departure_time time;

-- 2. Add comment for documentation
COMMENT ON COLUMN public.bookings.arrival_time IS 'Expected arrival time for the booking';
COMMENT ON COLUMN public.bookings.departure_time IS 'Expected departure time for the booking';

COMMIT;
