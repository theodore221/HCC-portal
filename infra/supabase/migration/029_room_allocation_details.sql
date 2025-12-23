-- 029_room_allocation_details.sql
-- Add columns to room_assignments for storing guest names and selected extras

ALTER TABLE public.room_assignments
  ADD COLUMN IF NOT EXISTS guest_names TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS extra_bed_selected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ensuite_selected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS private_study_selected BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.room_assignments.guest_names IS 'Array of guest names staying in this room';
COMMENT ON COLUMN public.room_assignments.extra_bed_selected IS 'Whether extra bed addon is selected (adds fee)';
COMMENT ON COLUMN public.room_assignments.ensuite_selected IS 'Whether ensuite bathroom addon is selected (adds fee)';
COMMENT ON COLUMN public.room_assignments.private_study_selected IS 'Whether private study addon is selected (adds fee)';
