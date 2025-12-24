-- Allow customers to update accommodation requests and room allocation details

create or replace function public.customer_update_accommodation_requests(
  p_booking_id uuid,
  p_new_requests jsonb
)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if not public.is_booking_owner(p_booking_id) then
    raise exception 'Not authorized';
  end if;

  update public.bookings
  set accommodation_requests = coalesce(p_new_requests, '{}'::jsonb),
      updated_at = now()
  where id = p_booking_id;
end;
$$;

grant execute on function public.customer_update_accommodation_requests(uuid, jsonb) to authenticated;

create or replace function public.customer_update_room_allocation_details(
  p_booking_id uuid,
  p_room_id uuid,
  p_guest_names text[],
  p_extra_bed boolean,
  p_ensuite boolean,
  p_private_study boolean
)
returns public.room_assignments
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  assignment_id uuid;
  updated public.room_assignments;
begin
  if not public.is_booking_owner(p_booking_id) then
    raise exception 'Not authorized';
  end if;

  select id
  into assignment_id
  from public.room_assignments
  where booking_id = p_booking_id
    and room_id = p_room_id
  limit 1;

  if assignment_id is null then
    raise exception 'Room assignment not found';
  end if;

  update public.room_assignments
  set guest_names = coalesce(p_guest_names, '{}'::text[]),
      extra_bed_selected = coalesce(p_extra_bed, false),
      ensuite_selected = coalesce(p_ensuite, false),
      private_study_selected = coalesce(p_private_study, false)
  where id = assignment_id
  returning * into updated;

  return updated;
end;
$$;

grant execute on function public.customer_update_room_allocation_details(
  uuid,
  uuid,
  text[],
  boolean,
  boolean,
  boolean
) to authenticated;
