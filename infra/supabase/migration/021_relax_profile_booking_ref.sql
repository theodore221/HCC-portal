-- Relax the unique constraint on profiles.booking_reference to allow customers to have multiple bookings
-- or simply to decouple the profile from a single booking reference.

DROP INDEX IF EXISTS public.idx_profiles_booking_reference;

-- We might still want an index for lookups, but not unique
CREATE INDEX IF NOT EXISTS idx_profiles_booking_reference ON public.profiles(booking_reference);
