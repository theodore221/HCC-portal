-- Allow customers to update limited meal job fields for their own bookings

create or replace function public.customer_meal_job_update_allowed(
  job_id uuid,
  new_booking_id uuid,
  new_service_date date,
  new_meal public.meal_type,
  new_service_time time,
  new_counts_by_diet jsonb,
  new_assignment_mode public.assignment_mode,
  new_assigned_caterer_id uuid,
  new_status public.meal_job_status,
  new_requested_service_time text
)
returns boolean
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  existing public.meal_jobs;
begin
  select * into existing
  from public.meal_jobs
  where id = job_id;

  if not found then
    return false;
  end if;

  if not public.is_booking_owner(existing.booking_id) then
    return false;
  end if;

  if existing.booking_id is distinct from new_booking_id then
    return false;
  end if;

  if existing.service_date is distinct from new_service_date then
    return false;
  end if;

  if existing.meal is distinct from new_meal then
    return false;
  end if;

  if existing.service_time is distinct from new_service_time then
    return false;
  end if;

  if existing.counts_by_diet is distinct from new_counts_by_diet then
    return false;
  end if;

  if existing.assignment_mode is distinct from new_assignment_mode then
    return false;
  end if;

  if existing.assigned_caterer_id is distinct from new_assigned_caterer_id then
    return false;
  end if;

  if existing.status is distinct from new_status then
    return false;
  end if;

  if existing.requested_service_time is distinct from new_requested_service_time then
    return false;
  end if;

  return true;
end;
$$;

grant execute on function public.customer_meal_job_update_allowed(
  uuid,
  uuid,
  date,
  public.meal_type,
  time,
  jsonb,
  public.assignment_mode,
  uuid,
  public.meal_job_status,
  text
) to authenticated;

drop policy if exists "meal_jobs customer update limited" on public.meal_jobs;
create policy "meal_jobs customer update limited" on public.meal_jobs
for update using (public.is_booking_owner(booking_id))
with check (
  public.customer_meal_job_update_allowed(
    id,
    booking_id,
    service_date,
    meal,
    service_time,
    counts_by_diet,
    assignment_mode,
    assigned_caterer_id,
    status,
    requested_service_time
  )
);
