-- 026_add_room_pricing_unit.sql

-- Add pricing_unit column to room_types
ALTER TABLE public.room_types
ADD COLUMN IF NOT EXISTS pricing_unit text NOT NULL DEFAULT 'PerRoom' CHECK (pricing_unit IN ('PerRoom', 'PerBed'));

-- Update seed data
-- Twin Single -> PerBed, $110
UPDATE public.room_types
SET pricing_unit = 'PerBed', price = 110
WHERE name = 'Twin Single';

-- Single -> PerRoom (or PerBed, effectively same), $110
UPDATE public.room_types
SET pricing_unit = 'PerRoom', price = 110
WHERE name = 'Single';

-- Queen Bed -> PerRoom, default price (user didn't specify, maybe 0 or keep existing)
-- I'll leave it as is or set to 0 if null.
-- Assuming existing data might have 0.

-- King Bed -> PerRoom
UPDATE public.room_types
SET pricing_unit = 'PerRoom'
WHERE name = 'King Bed';

-- Double Bed -> PerRoom
UPDATE public.room_types
SET pricing_unit = 'PerRoom'
WHERE name = 'Double Bed';
