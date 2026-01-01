-- Add RLS policies for customers to manage their own dietary profiles
-- This fixes the "new row violates row-level security policy" error

-- Allow customers to insert dietary profiles for their own bookings
CREATE POLICY "dietary_profiles customer insert" ON public.dietary_profiles
FOR INSERT
WITH CHECK (public.is_booking_owner(booking_id));

-- Allow customers to update dietary profiles for their own bookings
CREATE POLICY "dietary_profiles customer update" ON public.dietary_profiles
FOR UPDATE
USING (public.is_booking_owner(booking_id))
WITH CHECK (public.is_booking_owner(booking_id));

-- Allow customers to delete dietary profiles for their own bookings
CREATE POLICY "dietary_profiles customer delete" ON public.dietary_profiles
FOR DELETE
USING (public.is_booking_owner(booking_id));
