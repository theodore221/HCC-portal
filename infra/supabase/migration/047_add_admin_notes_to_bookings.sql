-- Add admin_notes field to bookings table for internal notes during review

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Create index for faster text search on admin notes (useful for searching internal notes)
CREATE INDEX IF NOT EXISTS idx_bookings_admin_notes_gin
  ON public.bookings USING gin(to_tsvector('english', admin_notes))
  WHERE admin_notes IS NOT NULL;

COMMENT ON COLUMN public.bookings.admin_notes IS 'Internal admin notes for tracking review decisions, special requirements, and communication history';
