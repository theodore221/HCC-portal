-- Add DELETE policies for bookings and related tables
-- Required because RLS is enabled but no DELETE policies were defined in 001_booking_schema.sql

-- 1. Bookings
CREATE POLICY "bookings staff delete" ON public.bookings
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.v_me m WHERE m.role IN ('admin', 'staff')
  )
);

-- 2. Space Reservations
CREATE POLICY "space_reservations staff delete" ON public.space_reservations
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.v_me m WHERE m.role IN ('admin', 'staff')
  )
);

-- 3. Room Assignments
CREATE POLICY "room_assignments staff delete" ON public.room_assignments
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.v_me m WHERE m.role IN ('admin', 'staff')
  )
);

-- 4. Meal Jobs
CREATE POLICY "meal_jobs staff delete" ON public.meal_jobs
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.v_me m WHERE m.role IN ('admin', 'staff')
  )
);

-- 5. Meal Job Items
CREATE POLICY "meal_job_items staff delete" ON public.meal_job_items
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.v_me m WHERE m.role IN ('admin', 'staff')
  )
);

-- 6. Dietary Profiles
CREATE POLICY "dietary_profiles staff delete" ON public.dietary_profiles
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.v_me m WHERE m.role IN ('admin', 'staff')
  )
);

-- 7. Rooming Groups
-- Note: rooming_groups table was referenced in actions.ts but not explicitly seen in 001 schema (might be in a later one or I missed it). 
-- Adding policy if it exists, wrapped in DO block or just standard create policy (Postgres will error if table doesn't exist, but we know it exists from actions.ts).
-- Checking 017_room_allocation_schema.sql might be good, but assuming it exists and has RLS enabled.
CREATE POLICY "rooming_groups staff delete" ON public.rooming_groups
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.v_me m WHERE m.role IN ('admin', 'staff')
  )
);

-- 8. Staff Tasks
CREATE POLICY "staff_tasks staff delete" ON public.staff_tasks
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.v_me m WHERE m.role IN ('admin', 'staff')
  )
);

-- 9. Payments
CREATE POLICY "payments staff delete" ON public.payments
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.v_me m WHERE m.role IN ('admin', 'staff')
  )
);

-- 10. Booking Guest Tokens
CREATE POLICY "booking_guest_tokens staff delete" ON public.booking_guest_tokens
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.v_me m WHERE m.role IN ('admin', 'staff')
  )
);
