-- Align legacy profiles table with auth-linked schema expectations
-- This migration upgrades environments that applied the original 001_booking_schema.sql
-- before the profiles/auth alignment was introduced.

-- 1. Rename legacy columns if they are still present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'user_id'
  ) THEN
    EXECUTE 'alter table public.profiles rename column user_id to id';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'display_name'
  ) THEN
    EXECUTE 'alter table public.profiles rename column display_name to full_name';
  END IF;
END
$$;

-- 2. Ensure the expanded column set is available
alter table public.profiles
  add column if not exists email text,
  add column if not exists booking_reference text,
  add column if not exists guest_token text;

-- 3. Refresh the role constraint to use the lower-case values expected by the app
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin','staff','caterer','customer'));

-- 4. Normalise existing data
update public.profiles
set role = lower(role)
where role <> lower(role);

update public.profiles as p
set
  email = case when u.email is not null then lower(u.email) else p.email end,
  full_name = coalesce(nullif(p.full_name, ''), coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))),
  booking_reference = coalesce(p.booking_reference, nullif(u.raw_user_meta_data->>'booking_reference', '')),
  guest_token = coalesce(p.guest_token, nullif(u.raw_user_meta_data->>'guest_token', '')),
  caterer_id = coalesce(p.caterer_id,
    case
      when (u.raw_user_meta_data->>'caterer_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then (u.raw_user_meta_data->>'caterer_id')::uuid
      else null
    end
  )
from auth.users u
where u.id = p.id;

-- 5. Backfill any missing profiles for auth users that now require them
insert into public.profiles (id, email, full_name, role, booking_reference, guest_token, caterer_id, created_at)
select
  u.id,
  lower(u.email),
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  case lower(coalesce(u.raw_user_meta_data->>'role', ''))
    when 'admin' then 'admin'
    when 'staff' then 'staff'
    when 'caterer' then 'caterer'
    else 'customer'
  end,
  nullif(u.raw_user_meta_data->>'booking_reference', ''),
  nullif(u.raw_user_meta_data->>'guest_token', ''),
  case
    when (u.raw_user_meta_data->>'caterer_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then (u.raw_user_meta_data->>'caterer_id')::uuid
    else null
  end,
  coalesce(u.created_at, now())
from auth.users u
where u.email is not null
  and not exists (select 1 from public.profiles p where p.id = u.id);

-- 6. Recreate indexes for the new profile lookup columns
create unique index if not exists idx_profiles_email_unique
  on public.profiles (lower(email))
  where email is not null;

create unique index if not exists idx_profiles_booking_reference
  on public.profiles (booking_reference)
  where booking_reference is not null;

create unique index if not exists idx_profiles_guest_token
  on public.profiles (guest_token)
  where guest_token is not null;

-- 7. Refresh the helper view and policies that depend on the profiles schema
create or replace view public.v_me as
select u.id as user_id,
       p.role,
       p.caterer_id
from auth.users u
left join public.profiles p on p.id = u.id
where u.id = auth.uid();

-- Drop old policy definitions that relied on the legacy casing
drop policy if exists "profiles self" on public.profiles;
create policy "profiles self" on public.profiles
for select using (auth.uid() = id);

drop policy if exists "bookings staff read" on public.bookings;
create policy "bookings staff read" on public.bookings
for select using (exists (select 1 from public.v_me m where m.role in ('admin','staff')));

drop policy if exists "bookings staff insert" on public.bookings;
create policy "bookings staff insert" on public.bookings
for insert with check (exists (select 1 from public.v_me m where m.role in ('admin','staff')));

drop policy if exists "bookings staff update" on public.bookings;
create policy "bookings staff update" on public.bookings
for update using (exists (select 1 from public.v_me m where m.role in ('admin','staff')));

drop policy if exists "bookings caterer read" on public.bookings;
create policy "bookings caterer read" on public.bookings
for select using (
  exists (
    select 1
    from public.v_me m
    join public.meal_jobs mj on mj.assigned_caterer_id = m.caterer_id
    where m.role = 'caterer'
      and mj.booking_id = bookings.id
  )
);

drop policy if exists "bookings customer read" on public.bookings;
create policy "bookings customer read" on public.bookings
for select using (
  exists (
    select 1
    from public.v_me m
    where m.role = 'customer'
      and bookings.customer_user_id = m.user_id
  )
);

drop policy if exists "meal_jobs staff all" on public.meal_jobs;
create policy "meal_jobs staff all" on public.meal_jobs
for all using (exists (select 1 from public.v_me m where m.role in ('admin','staff')))
with check (exists (select 1 from public.v_me m where m.role in ('admin','staff')));

drop policy if exists "meal_jobs caterer read" on public.meal_jobs;
create policy "meal_jobs caterer read" on public.meal_jobs
for select using (exists (select 1 from public.v_me m where m.role = 'caterer' and m.caterer_id = meal_jobs.assigned_caterer_id));

drop policy if exists "space_reservations staff all" on public.space_reservations;
create policy "space_reservations staff all" on public.space_reservations
for all using (exists (select 1 from public.v_me m where m.role in ('admin','staff')))
with check (exists (select 1 from public.v_me m where m.role in ('admin','staff')));

drop policy if exists "room_assignments staff all" on public.room_assignments;
create policy "room_assignments staff all" on public.room_assignments
for all using (exists (select 1 from public.v_me m where m.role in ('admin','staff')))
with check (exists (select 1 from public.v_me m where m.role in ('admin','staff')));

drop policy if exists "dietary_profiles staff all" on public.dietary_profiles;
create policy "dietary_profiles staff all" on public.dietary_profiles
for all using (exists (select 1 from public.v_me m where m.role in ('admin','staff')))
with check (exists (select 1 from public.v_me m where m.role in ('admin','staff')));

drop policy if exists "staff_tasks staff all" on public.staff_tasks;
create policy "staff_tasks staff all" on public.staff_tasks
for all using (exists (select 1 from public.v_me m where m.role in ('admin','staff')))
with check (exists (select 1 from public.v_me m where m.role in ('admin','staff')));

drop policy if exists "notifications self" on public.notifications;
create policy "notifications self" on public.notifications
for select using (auth.uid() = user_id);

drop policy if exists "booking_tokens staff read" on public.booking_guest_tokens;
create policy "booking_tokens staff read" on public.booking_guest_tokens
for select using (exists (select 1 from public.v_me m where m.role in ('admin','staff')));
