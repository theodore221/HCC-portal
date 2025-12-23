-- 028_add_chapter_room.sql
-- Add Chapter room to the rooms table (Ground Floor, Preston Wing)
-- This room is kept inactive by default (emergency use only)

-- First, ensure the room type exists (using Twin Single as it's a multi-bed room)
-- Then insert the Chapter room

WITH types AS (
    SELECT id, name FROM public.room_types
)
INSERT INTO public.rooms (name, room_number, level, wing, room_type_id, extra_bed_allowed, extra_bed_fee, ensuite_available, ensuite_fee, private_study_available, private_study_fee, active, notes)
VALUES
('Chapter', 'Chapter', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Chapter'), true, 50, false, 0, false, 0, false, 'Chapter Room - Only available upon request (reserved for emergencies)')
ON CONFLICT (room_number, wing) DO UPDATE SET
    name = EXCLUDED.name,
    level = EXCLUDED.level,
    room_type_id = EXCLUDED.room_type_id,
    extra_bed_allowed = EXCLUDED.extra_bed_allowed,
    extra_bed_fee = EXCLUDED.extra_bed_fee,
    ensuite_available = EXCLUDED.ensuite_available,
    ensuite_fee = EXCLUDED.ensuite_fee,
    private_study_available = EXCLUDED.private_study_available,
    private_study_fee = EXCLUDED.private_study_fee,
    active = EXCLUDED.active,
    notes = EXCLUDED.notes;

-- Also ensure Room 34 is marked as inactive (emergency use)
UPDATE public.rooms
SET active = false,
    notes = 'Only available upon request (reserved for emergencies)'
WHERE room_number = '34' AND wing = 'Preston Wing';

-- Mark Room 1 (Ground Floor) as inactive (private study for Room 2)
UPDATE public.rooms
SET active = false,
    notes = 'Private study for Room 2. Can be used as additional ensuite room if needed'
WHERE room_number = '1' AND wing = 'Preston Wing' AND level = 'Ground Floor';
