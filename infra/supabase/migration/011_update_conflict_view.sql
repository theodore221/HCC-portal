create or replace view public.v_space_conflicts as
select r1.booking_id,
       r1.space_id,
       r1.service_date,
       r2.booking_id as conflicts_with
from public.space_reservations r1
join public.space_reservations r2
  on r1.space_id = r2.space_id
 and r1.service_date = r2.service_date
 and coalesce(r1.start_time, time '00:00') < coalesce(r2.end_time, time '23:59')
 and coalesce(r2.start_time, time '00:00') < coalesce(r1.end_time, time '23:59')
 -- Removed status check to include 'Held' bookings as conflicts
 and r1.booking_id <> r2.booking_id;
