-- 8. Ensure profiles exist for the current authenticated user
create or replace function public.ensure_profile_for_current_user()
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_record auth.users%rowtype;
  current_profile public.profiles%rowtype;
  trusted_app_meta jsonb;
  trusted_role public.profiles.role%type := 'customer';
  trusted_booking_reference public.profiles.booking_reference%type := null;
  trusted_guest_token public.profiles.guest_token%type := null;
  trusted_caterer_id public.profiles.caterer_id%type := null;
  candidate_booking_reference text;
  candidate_caterer_id text;
begin
  select *
  into current_user_record
  from auth.users
  where id = auth.uid();

  if not found then
    raise exception 'No authenticated user found for ensure_profile_for_current_user()';
  end if;

  select *
  into current_profile
  from public.profiles
  where id = current_user_record.id;

  if not found then
    trusted_app_meta := coalesce(
      nullif(current_user_record.raw_app_meta_data->'profile_seed', '{}'::jsonb),
      nullif(current_user_record.raw_app_meta_data, '{}'::jsonb),
      '{}'::jsonb
    );

    if trusted_app_meta ? 'role' then
      trusted_role := case lower(trusted_app_meta->>'role')
        when 'admin' then 'admin'
        when 'staff' then 'staff'
        when 'caterer' then 'caterer'
        else 'customer'
      end;
    end if;

    if trusted_app_meta ? 'booking_reference' then
      candidate_booking_reference := nullif(trusted_app_meta->>'booking_reference', '');

      if candidate_booking_reference is not null and exists (
        select 1
        from public.bookings b
        where b.reference = candidate_booking_reference
          and (
            b.customer_user_id = current_user_record.id
            or (
              b.customer_user_id is null
              and lower(b.customer_email) = lower(current_user_record.email)
            )
          )
      ) then
        trusted_booking_reference := candidate_booking_reference;
      end if;
    end if;

    if trusted_app_meta ? 'guest_token' then
      trusted_guest_token := nullif(trusted_app_meta->>'guest_token', '');
    end if;

    if trusted_app_meta ? 'caterer_id' then
      candidate_caterer_id := nullif(trusted_app_meta->>'caterer_id', '');

      if candidate_caterer_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        select c.id
        into trusted_caterer_id
        from public.caterers c
        where c.id = (candidate_caterer_id)::uuid
        limit 1;
      end if;
    end if;

    if trusted_caterer_id is null then
      select c.id
      into trusted_caterer_id
      from public.caterers c
      where c.user_id = current_user_record.id
      limit 1;
    end if;

    if trusted_caterer_id is not null and trusted_role not in ('admin','staff') then
      trusted_role := 'caterer';
    end if;

    if trusted_role = 'caterer' and trusted_caterer_id is null then
      trusted_role := 'customer';
    end if;

    insert into public.profiles (
      id,
      email,
      full_name,
      role,
      booking_reference,
      guest_token,
      caterer_id,
      created_at
    )
    values (
      current_user_record.id,
      lower(current_user_record.email),
      coalesce(current_user_record.raw_user_meta_data->>'full_name', split_part(current_user_record.email, '@', 1)),
      trusted_role,
      trusted_booking_reference,
      trusted_guest_token,
      trusted_caterer_id,
      coalesce(current_user_record.created_at, now())
    )
    returning * into current_profile;
  end if;

  return current_profile;
end;
$$;

grant execute on function public.ensure_profile_for_current_user() to authenticated;
