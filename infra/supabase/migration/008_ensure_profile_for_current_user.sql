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
      case lower(coalesce(current_user_record.raw_user_meta_data->>'role', ''))
        when 'admin' then 'admin'
        when 'staff' then 'staff'
        when 'caterer' then 'caterer'
        else 'customer'
      end,
      nullif(current_user_record.raw_user_meta_data->>'booking_reference', ''),
      nullif(current_user_record.raw_user_meta_data->>'guest_token', ''),
      case
        when (current_user_record.raw_user_meta_data->>'caterer_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then (current_user_record.raw_user_meta_data->>'caterer_id')::uuid
        else null
      end,
      coalesce(current_user_record.created_at, now())
    )
    returning * into current_profile;
  end if;

  return current_profile;
end;
$$;

grant execute on function public.ensure_profile_for_current_user() to authenticated;
