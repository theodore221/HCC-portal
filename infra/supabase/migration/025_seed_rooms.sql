-- 025_seed_rooms.sql

-- 1. Seed Room Types
-- Ensure 'Single' exists (renaming 'Single Bed' if it exists, or inserting)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.room_types WHERE name = 'Single Bed') THEN
        UPDATE public.room_types SET name = 'Single' WHERE name = 'Single Bed';
    ELSE
        INSERT INTO public.room_types (name, capacity, description) VALUES ('Single', 1, 'Single bed accommodation') ON CONFLICT (name) DO NOTHING;
    END IF;
END $$;

-- Insert other types
INSERT INTO public.room_types (name, capacity, description) VALUES
('Queen Bed', 1, 'Queen bed accommodation'),
('Twin Single', 2, 'Two single beds'),
('King Bed', 1, 'King bed accommodation')
ON CONFLICT (name) DO NOTHING;

-- 2. Seed Rooms
-- Drop incorrect constraint if it exists (from failed run)
ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_room_number_key;

-- Drop correct constraint if it exists (to ensure clean slate)
ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_room_number_wing_key;

-- Add correct composite constraint
ALTER TABLE public.rooms ADD CONSTRAINT rooms_room_number_wing_key UNIQUE (room_number, wing);

-- Now insert data
WITH types AS (
    SELECT id, name FROM public.room_types
)
INSERT INTO public.rooms (name, room_number, level, wing, room_type_id, extra_bed_allowed, extra_bed_fee, ensuite_available, ensuite_fee, private_study_available, private_study_fee, notes)
VALUES
-- Ground Floor (Preston Wing)
('25', '25', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Queen Bed'), false, 0, true, 50, false, 0, null),
('26', '26', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('27', '27', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('28', '28', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('29', '29', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('30', '30', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('31', '31', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('32', '32', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('33', '33', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('34', '34', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, 'Only Available upon request (make this permanently unavailable unless Admin allocates)'),
('35', '35', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('36', '36', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('37', '37', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('38', '38', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('39', '39', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('40', '40', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('41', '41', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('42', '42', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Double Bed'), false, 0, false, 0, false, 0, 'Has access to Disabled bathroom'),
('43', '43', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('44', '44', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('45', '45', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('3', '3', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Double Bed'), false, 0, true, 50, false, 0, null),
('1', '1', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Single'), false, 0, true, 50, false, 0, 'If Room 2 requests the Private Study then this room is unavailable because it will be allocated as the private study'),
('2', '2', 'Ground Floor', 'Preston Wing', (SELECT id FROM types WHERE name = 'Double Bed'), false, 0, true, 50, true, 100, null),

-- Upper Floor (Foley Wing)
('1', '1', 'Upper Floor', 'Foley Wing', (SELECT id FROM types WHERE name = 'King Bed'), false, 0, true, 50, false, 0, null),
('2', '2', 'Upper Floor', 'Foley Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('3', '3', 'Upper Floor', 'Foley Wing', (SELECT id FROM types WHERE name = 'Double Bed'), false, 0, false, 0, false, 0, null),
('4', '4', 'Upper Floor', 'Foley Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('5', '5', 'Upper Floor', 'Foley Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('6', '6', 'Upper Floor', 'Foley Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('7', '7', 'Upper Floor', 'Foley Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('8', '8', 'Upper Floor', 'Foley Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('9', '9', 'Upper Floor', 'Foley Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('10', '10', 'Upper Floor', 'Foley Wing', (SELECT id FROM types WHERE name = 'Double Bed'), false, 0, false, 0, false, 0, null),
('11', '11', 'Upper Floor', 'Foley Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('12', '12', 'Upper Floor', 'Foley Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('13', '13', 'Upper Floor', 'Foley Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('14', '14', 'Upper Floor', 'Foley Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('15', '15', 'Upper Floor', 'Foley Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('16', '16', 'Upper Floor', 'Foley Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('17', '17', 'Upper Floor', 'Foley Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('18', '18', 'Upper Floor', 'Foley Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('19', '19', 'Upper Floor', 'Foley Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('20', '20', 'Upper Floor', 'Foley Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('21', '21', 'Upper Floor', 'Foley Wing', (SELECT id FROM types WHERE name = 'Twin Single'), true, 50, false, 0, false, 0, null),
('22', '22', 'Upper Floor', 'Foley Wing', (SELECT id FROM types WHERE name = 'Queen Bed'), false, 0, false, 0, false, 0, null),
('23', '23', 'Upper Floor', 'Foley Wing', (SELECT id FROM types WHERE name = 'Double Bed'), false, 0, false, 0, false, 0, null)
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
    notes = EXCLUDED.notes;
