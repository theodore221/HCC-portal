-- Ensure legacy environments can enforce the lowercase role constraint
-- even if 004_update_profiles_schema.sql previously failed midway
-- because of pre-existing values outside the allowed set.

-- 1. Drop whichever version of the profiles_role_check constraint is present
alter table public.profiles drop constraint if exists profiles_role_check;

-- 2. Normalise existing values so they comply with the lowercase contract
update public.profiles
set role = lower(trim(role))
where role is not null
  and role <> lower(trim(role));

update public.profiles
set role = 'customer'
where role is null
   or role not in ('admin','staff','caterer','customer');

-- 3. Recreate the strict lowercase constraint now that data is clean
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin','staff','caterer','customer'));
