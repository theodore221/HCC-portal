create or replace function public.set_password_initialized_at()
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user uuid := auth.uid();
  updated_profile public.profiles;
begin
  if target_user is null then
    raise exception 'set_password_initialized_at can only be called by authenticated users';
  end if;

  update public.profiles
  set password_initialized_at = timezone('utc', now())
  where id = target_user
  returning * into updated_profile;

  if not found then
    raise exception 'No profile found for user %', target_user using errcode = 'P0002';
  end if;

  return updated_profile;
end;
$$;

revoke all on function public.set_password_initialized_at() from public;
grant execute on function public.set_password_initialized_at() to authenticated;
