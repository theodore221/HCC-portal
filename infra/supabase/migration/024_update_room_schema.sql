-- 024_update_room_schema.sql

-- Update rooms table
ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS level text,
ADD COLUMN IF NOT EXISTS wing text,
ADD COLUMN IF NOT EXISTS room_number text,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS ensuite_available boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS ensuite_fee numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS private_study_available boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS private_study_fee numeric(10,2) DEFAULT 0;

-- Remove base_beds as it will be derived from room_type
ALTER TABLE public.rooms
DROP COLUMN IF EXISTS base_beds;

-- Update room_assignments table
ALTER TABLE public.room_assignments
ADD COLUMN IF NOT EXISTS requested_addons text[] DEFAULT '{}';

-- Add indexes for new columns if necessary (e.g. for filtering by level/wing)
CREATE INDEX IF NOT EXISTS idx_rooms_level ON public.rooms(level);
CREATE INDEX IF NOT EXISTS idx_rooms_wing ON public.rooms(wing);
