-- Add byo_linen column to bookings table.
-- Previously linen preference was only captured inside the accommodation_requests JSONB
-- (set via the RPC ingest path). The new /booking/new portal form captures it as a
-- first-class boolean so admin dashboards can surface it directly.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS byo_linen boolean NOT NULL DEFAULT false;
