-- Adds a JSONB column that stores portal-specific metadata for autosave flows.
alter table public.bookings
add column if not exists portal_metadata jsonb default '{}'::jsonb;
