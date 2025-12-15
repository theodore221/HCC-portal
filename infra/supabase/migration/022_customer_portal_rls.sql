-- Add RLS policies for Customer Portal access

-- 1. space_reservations
create policy "space_reservations customer read" on public.space_reservations
for select using (
  exists (
    select 1
    from public.bookings b
    where b.id = space_reservations.booking_id
      and b.customer_user_id = auth.uid()
  )
);

-- 2. meal_jobs
create policy "meal_jobs customer read" on public.meal_jobs
for select using (
  exists (
    select 1
    from public.bookings b
    where b.id = meal_jobs.booking_id
      and b.customer_user_id = auth.uid()
  )
);

-- 3. meal_job_items
create policy "meal_job_items customer read" on public.meal_job_items
for select using (
  exists (
    select 1
    from public.meal_jobs mj
    join public.bookings b on b.id = mj.booking_id
    where mj.id = meal_job_items.meal_job_id
      and b.customer_user_id = auth.uid()
  )
);

-- 4. dietary_profiles
create policy "dietary_profiles customer read" on public.dietary_profiles
for select using (
  exists (
    select 1
    from public.bookings b
    where b.id = dietary_profiles.booking_id
      and b.customer_user_id = auth.uid()
  )
);

-- 5. room_assignments
create policy "room_assignments customer read" on public.room_assignments
for select using (
  exists (
    select 1
    from public.bookings b
    where b.id = room_assignments.booking_id
      and b.customer_user_id = auth.uid()
  )
);

-- 6. payments (if needed for financial status)
create policy "payments customer read" on public.payments
for select using (
  exists (
    select 1
    from public.bookings b
    where b.id = payments.booking_id
      and b.customer_user_id = auth.uid()
  )
);
