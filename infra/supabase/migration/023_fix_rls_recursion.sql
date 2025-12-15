-- Fix infinite recursion in RLS policies by using a SECURITY DEFINER function

-- 1. Create the helper function
create or replace function public.is_booking_owner(booking_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.bookings
    where id = booking_id
      and customer_user_id = auth.uid()
  );
end;
$$;

grant execute on function public.is_booking_owner(uuid) to authenticated;
grant execute on function public.is_booking_owner(uuid) to service_role;

-- 2. Update policies to use the function (breaking the recursion loop)

-- space_reservations
drop policy if exists "space_reservations customer read" on public.space_reservations;
create policy "space_reservations customer read" on public.space_reservations
for select using (public.is_booking_owner(booking_id));

-- meal_jobs
drop policy if exists "meal_jobs customer read" on public.meal_jobs;
create policy "meal_jobs customer read" on public.meal_jobs
for select using (public.is_booking_owner(booking_id));

-- meal_job_items
drop policy if exists "meal_job_items customer read" on public.meal_job_items;
create policy "meal_job_items customer read" on public.meal_job_items
for select using (
  exists (
    select 1
    from public.meal_jobs mj
    where mj.id = meal_job_items.meal_job_id
      and public.is_booking_owner(mj.booking_id)
  )
);

-- dietary_profiles
drop policy if exists "dietary_profiles customer read" on public.dietary_profiles;
create policy "dietary_profiles customer read" on public.dietary_profiles
for select using (public.is_booking_owner(booking_id));

-- room_assignments
drop policy if exists "room_assignments customer read" on public.room_assignments;
create policy "room_assignments customer read" on public.room_assignments
for select using (public.is_booking_owner(booking_id));

-- payments
drop policy if exists "payments customer read" on public.payments;
create policy "payments customer read" on public.payments
for select using (public.is_booking_owner(booking_id));
