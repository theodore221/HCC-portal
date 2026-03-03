-- Drop retired RPC: upsert_booking_snapshot was built for the Google Form pipeline
-- and is no longer called from TypeScript. Child records (space_reservations,
-- meal_jobs) are now inserted directly by the portal submission actions.

DROP FUNCTION IF EXISTS public.upsert_booking_snapshot(jsonb);
