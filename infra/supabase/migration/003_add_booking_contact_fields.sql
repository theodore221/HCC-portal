-- Migration: add booking contact fields and chapel flag
-- Adds columns introduced after initial schema migration.

alter table public.bookings
  add column if not exists contact_name text;

alter table public.bookings
  add column if not exists contact_phone text;

alter table public.bookings
  add column if not exists event_type text;

alter table public.bookings
  add column if not exists chapel_required boolean not null default false;

-- Backfill chapel_required if any existing reservations include the Chapel space.
update public.bookings b
set chapel_required = true
from public.space_reservations sr
where sr.booking_id = b.id
  and sr.space_id = 'Chapel';
