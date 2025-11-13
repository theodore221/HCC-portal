-- 10. Deprecate profile helper functions in favour of server actions
revoke execute on function public.ensure_profile_for_current_user() from authenticated;
revoke execute on function public.set_password_initialized_at() from authenticated;

comment on function public.ensure_profile_for_current_user() is
  'Deprecated: profile creation is now handled by the application server. Available for service role automation only.';

comment on function public.set_password_initialized_at() is
  'Deprecated: password initialization is now handled by the application server. Available for service role automation only.';

grant execute on function public.ensure_profile_for_current_user() to service_role;
grant execute on function public.set_password_initialized_at() to service_role;

